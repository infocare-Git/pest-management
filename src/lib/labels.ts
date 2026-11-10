import type {
  CaseStatus,
  CertificationStatus,
  FlagStatus,
  ReportIssue,
  Role,
  TestResult,
} from "./types";

export type Tone = "green" | "amber" | "red" | "slate" | "blue";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function pct(ratio: number | null | undefined, digits = 0): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return "—";
  return `${(ratio * 100).toFixed(digits)}%`;
}

export const ROLE_LABELS: Record<Role, string> = {
  lead_farmer: "Lead farmer / cooperative",
  expert: "Plant-protection expert",
  authority: "Authority / nursery officer",
  admin: "NAFHA admin",
};

export const CERT_META: Record<CertificationStatus, { en: string; ne: string; tone: Tone }> = {
  certified: { en: "Certified", ne: "प्रमाणित", tone: "green" },
  provisional: { en: "Provisional", ne: "अस्थायी", tone: "amber" },
  not_certified: { en: "Not certified", ne: "अप्रमाणित", tone: "red" },
  suspended: { en: "Suspended", ne: "निलम्बित", tone: "red" },
};

export const TEST_META: Record<TestResult, { en: string; ne: string; tone: Tone }> = {
  negative: { en: "Tested – disease free", ne: "परीक्षण – रोगमुक्त", tone: "green" },
  positive: { en: "Tested – disease found", ne: "परीक्षण – रोग भेटियो", tone: "red" },
  pending: { en: "Test pending", ne: "परीक्षण बाँकी", tone: "amber" },
  not_tested: { en: "Not tested", ne: "परीक्षण नगरिएको", tone: "red" },
};

export const FLAG_META: Record<FlagStatus, { en: string; tone: Tone }> = {
  open: { en: "Open", tone: "red" },
  investigating: { en: "Investigating", tone: "amber" },
  resolved: { en: "Resolved", tone: "green" },
  dismissed: { en: "Dismissed", tone: "slate" },
};

export const CASE_STATUS_META: Record<CaseStatus, { en: string; ne: string; tone: Tone }> = {
  pending_review: { en: "Awaiting expert check", ne: "विज्ञ जाँच बाँकी", tone: "amber" },
  released: { en: "Guidance released", ne: "सल्लाह उपलब्ध", tone: "green" },
};

export const ISSUE_META: Record<ReportIssue, { en: string; ne: string }> = {
  disease_symptoms: { en: "Saplings show disease symptoms", ne: "बिरुवामा रोगको लक्षण" },
  no_label: { en: "No label / batch code", ne: "लेबल वा ब्याच कोड छैन" },
  fake_certificate: { en: "Certificate looks false", ne: "प्रमाणपत्र नक्कली जस्तो" },
  wrong_variety: { en: "Wrong variety or rootstock", ne: "गलत जात वा रुटस्टक" },
  poor_quality: { en: "Poor quality / weak saplings", ne: "कमजोर गुणस्तरका बिरुवा" },
  other: { en: "Other", ne: "अन्य" },
};

export const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  red: "bg-rose-50 text-rose-800 ring-rose-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
  blue: "bg-sky-50 text-sky-800 ring-sky-600/20",
};
