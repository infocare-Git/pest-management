/* ---------- People ---------- */

export type Role = "lead_farmer" | "expert" | "authority" | "admin";

export interface Actor {
  role: Role;
  name: string;
}

/* ---------- NAFHA orchard database (owned by NAFHA, accessed via adapter) ---------- */

export type Crop = "mandarin";

export interface Orchard {
  /** NAFHA orchard ID. */
  id: string;
  ownerName: string;
  ownerPhone?: string;
  district: string;
  municipality: string;
  ward: number;
  crop: Crop;
  variety: string;
  treeCount: number;
  plantedYear: number;
  /** Source nursery of the saplings, if known. */
  sourceNurseryId?: string;
  /** Batch code of the saplings, if known. */
  saplingBatchCode?: string;
}

export type CertificationStatus = "certified" | "provisional" | "not_certified" | "suspended";
export type TestResult = "negative" | "positive" | "pending" | "not_tested";

export interface Nursery {
  id: string;
  /** Short code used as the batch-code prefix, e.g. "SYA-N01". */
  code: string;
  name: string;
  registrationNo: string;
  ownerName: string;
  phone?: string;
  district: string;
  municipality: string;
  certification: CertificationStatus;
  certifyingBody?: string;
  certificationExpiry?: string;
  /** Date of the last disease test of mother plants / stock. */
  lastTestDate?: string;
  lastTestResult: TestResult;
  notes?: string;
  updatedAt: string;
}

export interface SaplingBatch {
  id: string;
  /** Printed on the label and encoded in the QR code. */
  code: string;
  nurseryId: string;
  crop: Crop;
  variety: string;
  rootstock: string;
  quantity: number;
  propagatedOn: string;
  testResult: TestResult;
  testDate?: string;
  testLab?: string;
  createdAt: string;
}

/* ---------- Module 1: identification cases (owned by this app) ---------- */

export type ConditionId =
  | "citrus_greening"
  | "citrus_psyllid"
  | "fruit_fly"
  | "citrus_canker"
  | "gummosis"
  | "healthy"
  | "unclear";

export interface Prediction {
  condition: ConditionId;
  confidence: number;
}

export type CaseStatus = "pending_review" | "released";

export interface Case {
  id: string;
  createdAt: string;
  submittedBy: string;
  farmerName: string;
  farmerPhone?: string;
  orchardId?: string;
  crop: Crop;
  photos: string[];
  notes?: string;
  ai: {
    model: string;
    predictions: Prediction[];
    top: ConditionId;
    confidence: number;
  };
  reviewRequired: boolean;
  reviewReason?: string;
  review?: {
    expertName: string;
    condition: ConditionId;
    agreed: boolean;
    note?: string;
    reviewedAt: string;
  };
  /** The diagnosis shown to the farmer. Set once released. */
  finalCondition?: ConditionId;
  status: CaseStatus;
}

/* ---------- Module 2: reports and trace-back alerts (owned by this app) ---------- */

export type FlagStatus = "open" | "investigating" | "resolved" | "dismissed";

export type ReportIssue =
  | "disease_symptoms"
  | "no_label"
  | "fake_certificate"
  | "wrong_variety"
  | "poor_quality"
  | "other";

export interface FarmerReport {
  id: string;
  createdAt: string;
  updatedAt: string;
  reporterName: string;
  reporterPhone?: string;
  batchCode?: string;
  nurseryId?: string;
  /** Free-text seller name when the nursery is not in the registry. */
  sellerText?: string;
  issue: ReportIssue;
  description: string;
  photos: string[];
  status: FlagStatus;
  /** The authority the report was routed to. */
  authority: string;
  resolutionNote?: string;
}

export interface TraceAlert {
  id: string;
  createdAt: string;
  updatedAt: string;
  caseId: string;
  orchardId: string;
  nurseryId?: string;
  batchCode?: string;
  orchardPlantedYear: number;
  status: FlagStatus;
  authority: string;
  note?: string;
}

/* ---------- Settings ---------- */

export interface Settings {
  pilotDistrict: string;
  authorityName: string;
  /** validation = expert checks every result; graduated = spot checks only. */
  mode: "validation" | "graduated";
  /** Agreed accuracy threshold (0–1) for overall and greening accuracy. */
  accuracyThreshold: number;
  /** Minimum number of expert-reviewed cases before the threshold counts. */
  minReviewedCases: number;
  /** Minimum reviewed greening cases before greening accuracy counts. */
  minGreeningCases: number;
  /** Share of results randomly sent to an expert after graduation (0–1). */
  spotCheckRate: number;
  /** Below this AI confidence a result always goes to an expert (0–1). */
  autoReleaseMinConfidence: number;
  /** An orchard planted within this many years counts as "new" for trace-back. */
  newOrchardYears: number;
}

export interface Db {
  version: 1;
  settings: Settings;
  /** Stand-in for the NAFHA orchard database while running with the mock adapter. */
  nafha: {
    orchards: Orchard[];
    nurseries: Nursery[];
    batches: SaplingBatch[];
  };
  cases: Case[];
  reports: FarmerReport[];
  alerts: TraceAlert[];
}
