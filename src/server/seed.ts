import type {
  Case,
  ConditionId,
  Db,
  FarmerReport,
  Nursery,
  Orchard,
  SaplingBatch,
  TraceAlert,
} from "@/lib/types";
import { MODEL_CLASSES } from "@/lib/catalog";

/**
 * SAMPLE DATA for demonstration only. Names, places and records are illustrative.
 * In production, orchards/nurseries/batches come from the NAFHA orchard database.
 */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function daysAgo(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const DISTRICT = "Syangja";
const AUTHORITY = "Agriculture Knowledge Centre (AKC), Syangja";

export function createSeed(): Db {
  const year = new Date().getFullYear();

  const nurseries: Nursery[] = [
    {
      id: "NUR-001",
      code: "SYA-N01",
      name: "Aandhikhola Fruit Nursery",
      registrationNo: "SYA-NUR-2071-014",
      ownerName: "Ram Prasad Gautam",
      phone: "98XXXXXX01",
      district: DISTRICT,
      municipality: "Putalibazar",
      certification: "certified",
      certifyingBody: "National Centre for Fruit Development",
      certificationExpiry: `${year + 1}-06-30`,
      lastTestDate: daysAgo(70).slice(0, 10),
      lastTestResult: "negative",
      updatedAt: daysAgo(70),
    },
    {
      id: "NUR-002",
      code: "SYA-N02",
      name: "Waling Citrus Nursery",
      registrationNo: "SYA-NUR-2073-022",
      ownerName: "Sita Kumari Adhikari",
      phone: "98XXXXXX02",
      district: DISTRICT,
      municipality: "Waling",
      certification: "certified",
      certifyingBody: "National Centre for Fruit Development",
      certificationExpiry: `${year + 1}-03-31`,
      lastTestDate: daysAgo(130).slice(0, 10),
      lastTestResult: "negative",
      updatedAt: daysAgo(130),
    },
    {
      id: "NUR-003",
      code: "SYA-N03",
      name: "Galyang Krishi Nursery",
      registrationNo: "SYA-NUR-2079-041",
      ownerName: "Bishnu Thapa",
      district: DISTRICT,
      municipality: "Galyang",
      certification: "provisional",
      lastTestDate: daysAgo(20).slice(0, 10),
      lastTestResult: "pending",
      notes: "Screen house completed; awaiting mother-plant test results.",
      updatedAt: daysAgo(20),
    },
    {
      id: "NUR-004",
      code: "SYA-N04",
      name: "Kaligandaki Sapling Centre",
      registrationNo: "SYA-NUR-2080-057",
      ownerName: "Dil Bahadur Rana",
      district: DISTRICT,
      municipality: "Chapakot",
      certification: "not_certified",
      lastTestResult: "not_tested",
      updatedAt: daysAgo(200),
    },
    {
      id: "NUR-005",
      code: "SYA-N05",
      name: "Arjun Chaupari Bagwani Nursery",
      registrationNo: "SYA-NUR-2076-033",
      ownerName: "Hem Raj Paudel",
      district: DISTRICT,
      municipality: "Arjunchaupari",
      certification: "suspended",
      certifyingBody: "National Centre for Fruit Development",
      lastTestDate: daysAgo(40).slice(0, 10),
      lastTestResult: "positive",
      notes: "Greening confirmed in mother block. Sales suspended pending re-test.",
      updatedAt: daysAgo(40),
    },
  ];

  const batches: SaplingBatch[] = [
    batch("BAT-001", "SYA-N01-2507-01", "NUR-001", "Khoku local", "Trifoliate orange", 1200, 120, "negative"),
    batch("BAT-002", "SYA-N01-2601-02", "NUR-001", "Khoku local", "Trifoliate orange", 800, 300, "negative"),
    batch("BAT-003", "SYA-N02-2504-01", "NUR-002", "Okitsu Wase", "Trifoliate orange", 1500, 560, "negative"),
    batch("BAT-004", "SYA-N03-2608-01", "NUR-003", "Khoku local", "Rough lemon", 600, 90, "pending"),
    batch("BAT-005", "SYA-N04-2510-01", "NUR-004", "Unknown", "Unknown", 400, 390, "not_tested"),
    batch("BAT-006", "SYA-N05-2406-01", "NUR-005", "Khoku local", "Trifoliate orange", 2000, 880, "positive"),
    batch("BAT-007", "SYA-N05-2501-02", "NUR-005", "Khoku local", "Trifoliate orange", 900, 640, "pending"),
  ];

  const orchards: Orchard[] = [
    orchard("NAFHA-ORC-1001", "Hari Bahadur Thapa", "Putalibazar", 3, 180, 2012),
    orchard("NAFHA-ORC-1002", "Laxmi Gurung", "Putalibazar", 7, 95, 2016),
    orchard("NAFHA-ORC-1003", "Krishna Prasad Sharma", "Waling", 2, 240, 2019, "NUR-002"),
    orchard("NAFHA-ORC-1004", "Gita Kumari Poudel", "Waling", 9, 60, 2025, "NUR-002", "SYA-N02-2504-01"),
    orchard("NAFHA-ORC-1005", "Tek Bahadur Rana", "Galyang", 4, 120, 2024, "NUR-005", "SYA-N05-2406-01"),
    orchard("NAFHA-ORC-1006", "Mina Shrestha", "Galyang", 6, 75, 2025, "NUR-005", "SYA-N05-2501-02"),
    orchard("NAFHA-ORC-1007", "Bhim Prasad Aryal", "Chapakot", 1, 150, 2015),
    orchard("NAFHA-ORC-1008", "Sarita Kandel", "Chapakot", 5, 45, 2025, "NUR-004", "SYA-N04-2510-01"),
    orchard("NAFHA-ORC-1009", "Dhan Bahadur Gurung", "Arjunchaupari", 2, 300, 2010),
    orchard("NAFHA-ORC-1010", "Kamala Bhandari", "Putalibazar", 11, 110, 2025, "NUR-001", "SYA-N01-2507-01"),
    orchard("NAFHA-ORC-1011", "Prem Bahadur Khatri", "Waling", 4, 200, 2018),
    orchard("NAFHA-ORC-1012", "Radha Paudel", "Arjunchaupari", 8, 85, 2026, "NUR-001", "SYA-N01-2601-02"),
  ];

  /* ---- Historical cases: 40 expert-reviewed + 4 awaiting review ---- */
  const rand = rng(42);
  const weights: [ConditionId, number][] = [
    ["citrus_greening", 0.3],
    ["citrus_psyllid", 0.2],
    ["fruit_fly", 0.2],
    ["citrus_canker", 0.1],
    ["gummosis", 0.1],
    ["healthy", 0.1],
  ];
  const pick = (): ConditionId => {
    let r = rand();
    for (const [c, w] of weights) {
      if ((r -= w) < 0) return c;
    }
    return "healthy";
  };
  const leadFarmers = ["Hari B. Thapa (lead farmer)", "Putalibazar Fruit Cooperative", "Waling Agri Cooperative"];

  const cases: Case[] = [];
  for (let i = 0; i < 44; i++) {
    const truth: ConditionId = i === 0 ? "citrus_greening" : pick();
    const agreed = i === 0 || rand() < 0.88;
    const top = agreed
      ? truth
      : MODEL_CLASSES.filter((c) => c !== truth)[Math.floor(rand() * (MODEL_CLASSES.length - 1))];
    const confidence = 0.55 + rand() * 0.42;
    const others = MODEL_CLASSES.filter((c) => c !== top);
    const second = others[Math.floor(rand() * others.length)];
    const third = others.filter((c) => c !== second)[Math.floor(rand() * (others.length - 1))];
    const rest = 1 - confidence;
    const o = i === 0 ? orchards[4] : orchards[Math.floor(rand() * orchards.length)];
    const reviewed = i < 40;
    const createdAt = daysAgo(reviewed ? 60 - i : 2 - (i - 40) * 0.3, 9 + (i % 7));
    cases.push({
      id: `CASE-${String(1000 + i)}`,
      createdAt,
      submittedBy: leadFarmers[i % leadFarmers.length],
      farmerName: o.ownerName,
      orchardId: o.id,
      crop: "mandarin",
      photos: [],
      notes: i === 0 ? "Yellow blotchy leaves on 6 young trees, fruit small and lopsided." : undefined,
      ai: {
        model: "demo-classifier-v0",
        predictions: [
          { condition: top, confidence },
          { condition: second, confidence: rest * 0.7 },
          { condition: third, confidence: rest * 0.2 },
        ],
        top,
        confidence,
      },
      reviewRequired: true,
      reviewReason: "Pilot validation: every result is checked by an expert",
      review: reviewed
        ? {
            expertName: "NAFHA plant-protection expert",
            condition: truth,
            agreed,
            note: agreed ? undefined : "Corrected from photo; symptoms consistent with expert label.",
            reviewedAt: new Date(new Date(createdAt).getTime() + 5 * 3600_000).toISOString(),
          }
        : undefined,
      finalCondition: reviewed ? truth : undefined,
      status: reviewed ? "released" : "pending_review",
    });
  }

  const alerts: TraceAlert[] = [
    {
      id: "TRC-0001",
      createdAt: cases[0].review!.reviewedAt,
      updatedAt: cases[0].review!.reviewedAt,
      caseId: cases[0].id,
      orchardId: orchards[4].id,
      nurseryId: "NUR-005",
      batchCode: "SYA-N05-2406-01",
      orchardPlantedYear: orchards[4].plantedYear,
      status: "investigating",
      authority: AUTHORITY,
      note: "Nursery inspected; mother block sampled. Other buyers of this batch being contacted.",
    },
  ];

  const reports: FarmerReport[] = [
    {
      id: "RPT-0001",
      createdAt: daysAgo(9),
      updatedAt: daysAgo(9),
      reporterName: "Sarita Kandel",
      batchCode: "SYA-N04-2510-01",
      nurseryId: "NUR-004",
      issue: "no_label",
      description: "Saplings sold at the haat bazaar with no certificate. Seller said they came from Chapakot.",
      photos: [],
      status: "open",
      authority: AUTHORITY,
    },
    {
      id: "RPT-0002",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
      reporterName: "Mina Shrestha",
      batchCode: "SYA-N05-2501-02",
      nurseryId: "NUR-005",
      issue: "disease_symptoms",
      description: "Several new saplings have yellow mottled leaves within months of planting.",
      photos: [],
      status: "open",
      authority: AUTHORITY,
    },
  ];

  return {
    version: 1,
    settings: {
      pilotDistrict: DISTRICT,
      authorityName: AUTHORITY,
      mode: "validation",
      accuracyThreshold: 0.9,
      minReviewedCases: 150,
      minGreeningCases: 30,
      spotCheckRate: 0.1,
      autoReleaseMinConfidence: 0.7,
      newOrchardYears: 3,
    },
    nafha: { orchards, nurseries, batches },
    cases,
    reports,
    alerts,
  };

  function batch(
    id: string,
    code: string,
    nurseryId: string,
    variety: string,
    rootstock: string,
    quantity: number,
    ageDays: number,
    testResult: SaplingBatch["testResult"],
  ): SaplingBatch {
    return {
      id,
      code,
      nurseryId,
      crop: "mandarin",
      variety,
      rootstock,
      quantity,
      propagatedOn: daysAgo(ageDays).slice(0, 10),
      testResult,
      testDate: testResult === "negative" || testResult === "positive" ? daysAgo(ageDays - 30).slice(0, 10) : undefined,
      testLab: testResult === "negative" || testResult === "positive" ? "National Plant Pathology Lab (sample)" : undefined,
      createdAt: daysAgo(ageDays),
    };
  }

  function orchard(
    id: string,
    ownerName: string,
    municipality: string,
    ward: number,
    treeCount: number,
    plantedYear: number,
    sourceNurseryId?: string,
    saplingBatchCode?: string,
  ): Orchard {
    return {
      id,
      ownerName,
      district: DISTRICT,
      municipality,
      ward,
      crop: "mandarin",
      variety: "Khoku local",
      treeCount,
      plantedYear,
      sourceNurseryId,
      saplingBatchCode,
    };
  }
}
