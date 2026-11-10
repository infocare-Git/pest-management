import type {
  Case,
  ConditionId,
  Db,
  FarmerReport,
  FlagStatus,
  Nursery,
  ReportIssue,
  SaplingBatch,
  Settings,
  TraceAlert,
} from "@/lib/types";
import { ALL_CONDITIONS, MODEL_CLASSES } from "@/lib/catalog";
import { mutate, newId, nowISO, readDb, saveUpload } from "./db";
import { getClassifier, topPredictions } from "./classifier";
import { nafha, normalizeCode, UserError } from "./nafha";

/* =====================================================================
   Module 1 — identification
   ===================================================================== */

export interface ValidationStats {
  reviewed: number;
  agreed: number;
  accuracy: number | null;
  greeningReviewed: number;
  greeningCorrect: number;
  /** Of cases the expert labelled greening, share the AI also called greening. */
  greeningAccuracy: number | null;
  perCondition: {
    condition: ConditionId;
    n: number;
    correct: number;
    recall: number | null;
    /** Of AI predictions of this condition, share confirmed by the expert. */
    predicted: number;
    precision: number | null;
  }[];
  /** confusion[expert][ai] = count */
  confusion: Record<string, Record<string, number>>;
  thresholdMet: boolean;
  gaps: string[];
}

export function computeValidation(db: Db): ValidationStats {
  const s = db.settings;
  // "Unclear" expert labels mean the photo was unusable, so they are excluded.
  const reviewed = db.cases.filter((c) => c.review && c.review.condition !== "unclear");
  const agreed = reviewed.filter((c) => c.review!.condition === c.ai.top).length;
  const confusion: Record<string, Record<string, number>> = {};
  for (const c of reviewed) {
    const row = (confusion[c.review!.condition] ??= {});
    row[c.ai.top] = (row[c.ai.top] ?? 0) + 1;
  }
  const perCondition = MODEL_CLASSES.map((condition) => {
    const truth = reviewed.filter((c) => c.review!.condition === condition);
    const correct = truth.filter((c) => c.ai.top === condition).length;
    const predicted = reviewed.filter((c) => c.ai.top === condition);
    const tp = predicted.filter((c) => c.review!.condition === condition).length;
    return {
      condition,
      n: truth.length,
      correct,
      recall: truth.length ? correct / truth.length : null,
      predicted: predicted.length,
      precision: predicted.length ? tp / predicted.length : null,
    };
  });
  const g = perCondition.find((p) => p.condition === "citrus_greening")!;
  const accuracy = reviewed.length ? agreed / reviewed.length : null;

  const gaps: string[] = [];
  if (reviewed.length < s.minReviewedCases)
    gaps.push(`${s.minReviewedCases - reviewed.length} more expert-reviewed cases needed`);
  if (g.n < s.minGreeningCases)
    gaps.push(`${s.minGreeningCases - g.n} more reviewed greening cases needed`);
  if (accuracy === null || accuracy < s.accuracyThreshold)
    gaps.push(`Overall accuracy below ${Math.round(s.accuracyThreshold * 100)}%`);
  if (g.recall === null || g.recall < s.accuracyThreshold)
    gaps.push(`Greening accuracy below ${Math.round(s.accuracyThreshold * 100)}%`);

  return {
    reviewed: reviewed.length,
    agreed,
    accuracy,
    greeningReviewed: g.n,
    greeningCorrect: g.correct,
    greeningAccuracy: g.recall,
    perCondition,
    confusion,
    thresholdMet: gaps.length === 0,
    gaps,
  };
}

function decideReview(s: Settings, top: ConditionId, confidence: number): string | null {
  if (s.mode === "validation") return "Pilot validation: every result is checked by an expert";
  if (confidence < s.autoReleaseMinConfidence) return "Low AI confidence";
  if (top === "citrus_greening") return "Greening detections are always confirmed by an expert";
  if (Math.random() < s.spotCheckRate) return "Random quality spot-check";
  return null;
}

export async function createCase(input: {
  submittedBy: string;
  farmerName: string;
  farmerPhone?: string;
  orchardId?: string;
  notes?: string;
  photos: ArrayBuffer[];
}): Promise<Case> {
  if (!input.photos.length) throw new UserError("Add at least one photo");
  if (input.photos.length > 4) throw new UserError("At most 4 photos per case");
  if (!input.farmerName.trim()) throw new UserError("Farmer name is required");
  if (input.orchardId && !(await nafha.getOrchard(input.orchardId)))
    throw new UserError("Orchard not found in NAFHA database");

  const buffers = input.photos.map((p) => Buffer.from(p));
  const result = await getClassifier().classify(buffers);
  const preds = topPredictions(result.predictions, 3);
  if (!preds.length) throw new Error("Classifier returned no predictions");
  const top = preds[0];
  const photos = await Promise.all(input.photos.map(saveUpload));

  const created = await mutate((db) => {
    const reason = decideReview(db.settings, top.condition, top.confidence);
    const c: Case = {
      id: newId("CASE"),
      createdAt: nowISO(),
      submittedBy: input.submittedBy,
      farmerName: input.farmerName.trim(),
      farmerPhone: input.farmerPhone?.trim() || undefined,
      orchardId: input.orchardId || undefined,
      crop: "mandarin",
      photos,
      notes: input.notes?.trim() || undefined,
      ai: { model: result.model, predictions: preds, top: top.condition, confidence: top.confidence },
      reviewRequired: reason !== null,
      reviewReason: reason ?? undefined,
      finalCondition: reason ? undefined : top.condition,
      status: reason ? "pending_review" : "released",
    };
    db.cases.push(c);
    return c;
  });
  if (created.finalCondition) await onDiagnosisFinal(created);
  return created;
}

export async function reviewCase(
  id: string,
  input: { expertName: string; condition: ConditionId; note?: string },
): Promise<Case> {
  if (!ALL_CONDITIONS.includes(input.condition)) throw new UserError("Unknown condition");
  const updated = await mutate((db) => {
    const c = db.cases.find((x) => x.id === id);
    if (!c) throw new UserError("Case not found", 404);
    if (c.review) throw new UserError("This case has already been reviewed");
    c.review = {
      expertName: input.expertName,
      condition: input.condition,
      agreed: input.condition === c.ai.top,
      note: input.note?.trim() || undefined,
      reviewedAt: nowISO(),
    };
    c.finalCondition = input.condition;
    c.status = "released";
    return c;
  });
  await onDiagnosisFinal(updated);
  return updated;
}

/**
 * Module 1 → Module 2 link: greening in a *new* orchard is traced back to the
 * nursery and batch that supplied its saplings, and flagged to the authority.
 */
async function onDiagnosisFinal(c: Case): Promise<void> {
  if (c.finalCondition !== "citrus_greening" || !c.orchardId) return;
  const orchard = await nafha.getOrchard(c.orchardId);
  if (!orchard) return;
  const settings = (await readDb()).settings;
  const age = new Date().getFullYear() - orchard.plantedYear;
  if (age > settings.newOrchardYears) return;

  const batch = orchard.saplingBatchCode ? await nafha.getBatchByCode(orchard.saplingBatchCode) : null;
  const nurseryId = batch?.nurseryId ?? orchard.sourceNurseryId;

  await mutate((db) => {
    if (db.alerts.some((a) => a.caseId === c.id)) return;
    const now = nowISO();
    db.alerts.push({
      id: newId("TRC"),
      createdAt: now,
      updatedAt: now,
      caseId: c.id,
      orchardId: orchard.id,
      nurseryId,
      batchCode: batch?.code ?? orchard.saplingBatchCode,
      orchardPlantedYear: orchard.plantedYear,
      status: "open",
      authority: db.settings.authorityName,
      note: nurseryId ? undefined : "Source nursery unknown. Collect purchase details from the farmer.",
    });
  });
}

/* =====================================================================
   Module 2 — planting material
   ===================================================================== */

export type Verdict = "ok" | "caution" | "warning";

export interface Verification {
  code: string;
  batch: SaplingBatch | null;
  nursery: Nursery | null;
  verdict: Verdict;
  reasons: { en: string; ne: string; tone: "green" | "amber" | "red" }[];
  openReports: number;
  greeningTraces: number;
}

export async function verifyBatch(rawCode: string): Promise<Verification> {
  const code = normalizeCode(rawCode);
  const batch = await nafha.getBatchByCode(code);
  if (!batch) {
    return {
      code,
      batch: null,
      nursery: null,
      verdict: "warning",
      reasons: [
        {
          en: "This code is not in the NAFHA registry. Do not buy until the seller can show a registered batch.",
          ne: "यो कोड NAFHA दर्तामा छैन। बिक्रेताले दर्ता भएको ब्याच देखाउन नसकेसम्म नकिन्नुहोस्।",
          tone: "red",
        },
      ],
      openReports: 0,
      greeningTraces: 0,
    };
  }
  const nursery = await nafha.getNursery(batch.nurseryId);
  const db = await readDb();
  const openReports = db.reports.filter(
    (r) => r.batchCode === batch.code && (r.status === "open" || r.status === "investigating"),
  ).length;
  const greeningTraces = db.alerts.filter((a) => a.batchCode === batch.code && a.status !== "dismissed").length;

  const reasons: Verification["reasons"] = [];
  const today = new Date().toISOString().slice(0, 10);
  if (!nursery) {
    reasons.push({ en: "Nursery record missing.", ne: "नर्सरीको विवरण भेटिएन।", tone: "red" });
  } else if (nursery.certification === "certified") {
    if (nursery.certificationExpiry && nursery.certificationExpiry < today)
      reasons.push({ en: "Nursery certificate has expired.", ne: "नर्सरीको प्रमाणपत्रको म्याद सकिएको छ।", tone: "red" });
    else reasons.push({ en: "Nursery is certified.", ne: "नर्सरी प्रमाणित छ।", tone: "green" });
  } else if (nursery.certification === "provisional") {
    reasons.push({ en: "Nursery has only provisional certification.", ne: "नर्सरीको अस्थायी प्रमाणीकरण मात्र छ।", tone: "amber" });
  } else if (nursery.certification === "suspended") {
    reasons.push({ en: "Nursery certification is SUSPENDED.", ne: "नर्सरीको प्रमाणीकरण निलम्बित छ।", tone: "red" });
  } else {
    reasons.push({ en: "Nursery is not certified.", ne: "नर्सरी प्रमाणित छैन।", tone: "red" });
  }

  if (batch.testResult === "negative")
    reasons.push({ en: "Batch tested free of disease.", ne: "यो ब्याच रोगमुक्त भनी परीक्षण भएको छ।", tone: "green" });
  else if (batch.testResult === "pending")
    reasons.push({ en: "Disease test for this batch is still pending.", ne: "यो ब्याचको रोग परीक्षण बाँकी छ।", tone: "amber" });
  else if (batch.testResult === "positive")
    reasons.push({ en: "Disease was FOUND in this batch.", ne: "यो ब्याचमा रोग भेटिएको छ।", tone: "red" });
  else reasons.push({ en: "This batch has not been disease-tested.", ne: "यो ब्याचको रोग परीक्षण भएको छैन।", tone: "red" });

  if (greeningTraces)
    reasons.push({
      en: `Greening has been found in ${greeningTraces} orchard(s) planted with this batch.`,
      ne: `यो ब्याचका बिरुवा लगाएका ${greeningTraces} बगैंचामा ग्रिनिङ रोग भेटिएको छ।`,
      tone: "red",
    });
  if (openReports)
    reasons.push({
      en: `${openReports} farmer report(s) about this batch are under investigation.`,
      ne: `यो ब्याचबारे किसानका ${openReports} उजुरी छानबिनमा छन्।`,
      tone: "amber",
    });

  const verdict: Verdict = reasons.some((r) => r.tone === "red")
    ? "warning"
    : reasons.some((r) => r.tone === "amber")
      ? "caution"
      : "ok";
  return { code, batch, nursery, verdict, reasons, openReports, greeningTraces };
}

export async function createReport(input: {
  reporterName: string;
  reporterPhone?: string;
  batchCode?: string;
  nurseryId?: string;
  sellerText?: string;
  issue: ReportIssue;
  description: string;
  photos: ArrayBuffer[];
}): Promise<FarmerReport> {
  if (!input.reporterName.trim()) throw new UserError("Your name is required");
  if (!input.description.trim()) throw new UserError("Describe the problem");
  if (input.photos.length > 4) throw new UserError("At most 4 photos");
  const batchCode = input.batchCode ? normalizeCode(input.batchCode) : undefined;
  const batch = batchCode ? await nafha.getBatchByCode(batchCode) : null;
  const photos = await Promise.all(input.photos.map(saveUpload));
  return mutate((db) => {
    const now = nowISO();
    const r: FarmerReport = {
      id: newId("RPT"),
      createdAt: now,
      updatedAt: now,
      reporterName: input.reporterName.trim(),
      reporterPhone: input.reporterPhone?.trim() || undefined,
      batchCode,
      nurseryId: batch?.nurseryId ?? (input.nurseryId || undefined),
      sellerText: input.sellerText?.trim() || undefined,
      issue: input.issue,
      description: input.description.trim(),
      photos,
      status: "open",
      authority: db.settings.authorityName,
    };
    db.reports.push(r);
    return r;
  });
}

const FLAG_STATUSES: FlagStatus[] = ["open", "investigating", "resolved", "dismissed"];

export async function updateFlag(
  kind: "report" | "alert",
  id: string,
  input: { status: FlagStatus; note?: string },
): Promise<FarmerReport | TraceAlert> {
  if (!FLAG_STATUSES.includes(input.status)) throw new UserError("Invalid status");
  return mutate((db) => {
    const item = kind === "report" ? db.reports.find((r) => r.id === id) : db.alerts.find((a) => a.id === id);
    if (!item) throw new UserError("Not found", 404);
    item.status = input.status;
    item.updatedAt = nowISO();
    if (input.note !== undefined) {
      if (kind === "report") (item as FarmerReport).resolutionNote = input.note.trim() || undefined;
      else (item as TraceAlert).note = input.note.trim() || undefined;
    }
    return item;
  });
}

/** Next free batch code for a nursery: <NURSERY-CODE>-<YYMM>-<NN>. */
export async function nextBatchCode(nursery: Nursery): Promise<string> {
  const d = new Date();
  const prefix = `${nursery.code}-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}-`;
  const existing = (await nafha.listBatches({ nurseryId: nursery.id }))
    .filter((b) => b.code.startsWith(prefix))
    .map((b) => Number(b.code.slice(prefix.length)) || 0);
  return prefix + String(Math.max(0, ...existing) + 1).padStart(2, "0");
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return mutate((db) => {
    const s = { ...db.settings, ...patch };
    const ratio = (v: number) => Number.isFinite(v) && v >= 0 && v <= 1;
    if (!ratio(s.accuracyThreshold) || !ratio(s.spotCheckRate) || !ratio(s.autoReleaseMinConfidence))
      throw new UserError("Ratios must be between 0 and 1");
    if (s.minReviewedCases < 0 || s.minGreeningCases < 0 || s.newOrchardYears < 0)
      throw new UserError("Counts must be zero or more");
    if (s.mode !== "validation" && s.mode !== "graduated") throw new UserError("Invalid mode");
    if (patch.mode === "graduated" && db.settings.mode === "validation") {
      const v = computeValidation(db);
      if (!v.thresholdMet)
        throw new UserError(`Cannot leave validation mode yet: ${v.gaps.join("; ")}`);
    }
    db.settings = s;
    return s;
  });
}
