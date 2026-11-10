import Link from "next/link";
import { CaseRow } from "@/components/bits";
import { btn, Card, Empty, Notice, PageHeader, Stat, Table } from "@/components/ui";
import { pct } from "@/lib/labels";
import { readDb } from "@/server/db";
import { computeValidation } from "@/server/services";

export default async function Dashboard() {
  const db = await readDb();
  const v = computeValidation(db);
  const s = db.settings;
  const pending = db.cases.filter((c) => c.status === "pending_review");
  const greening = db.cases.filter((c) => c.finalCondition === "citrus_greening").length;
  const nurseries = db.nafha.nurseries;
  const certified = nurseries.filter((n) => n.certification === "certified").length;
  const openReports = db.reports.filter((r) => r.status === "open" || r.status === "investigating").length;
  const openAlerts = db.alerts.filter((a) => a.status === "open" || a.status === "investigating").length;
  const recent = [...db.cases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <>
      <PageHeader
        title="Pilot dashboard"
        description={`${s.pilotDistrict} district · mandarin · Module 1 (pest & disease) and Module 2 (planting material)`}
        actions={
          <>
            <Link href="/identify" className={btn.primary}>
              Check a tree
            </Link>
            <Link href="/verify" className={btn.secondary}>
              Verify a sapling
            </Link>
          </>
        }
      />

      <div className="mb-6">
        {s.mode === "validation" ? (
          <Notice tone="amber">
            <strong>Validation mode.</strong> An expert checks every AI result before guidance reaches the
            farmer. Accuracy so far: {pct(v.accuracy)} over {v.reviewed} reviewed cases (target{" "}
            {pct(s.accuracyThreshold)} over at least {s.minReviewedCases}).{" "}
            <Link href="/accuracy" className="underline">
              See progress
            </Link>
          </Notice>
        ) : (
          <Notice tone="green">
            <strong>Graduated.</strong> Results are auto-released. Low-confidence results, all greening
            detections and {pct(s.spotCheckRate)} random spot-checks still go to an expert.
          </Notice>
        )}
      </div>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Module 1 · Pest & disease identification
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Cases submitted" value={db.cases.length} />
        <Stat label="Awaiting expert" value={pending.length} tone={pending.length ? "amber" : undefined} />
        <Stat label="AI accuracy" value={pct(v.accuracy)} sub={`${v.agreed}/${v.reviewed} agreed with expert`} />
        <Stat label="Greening confirmed" value={greening} tone={greening ? "red" : undefined} />
      </div>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Module 2 · Planting-material quality
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Registered nurseries" value={nurseries.length} sub={`${certified} certified`} />
        <Stat label="Sapling batches" value={db.nafha.batches.length} />
        <Stat label="Open farmer reports" value={openReports} tone={openReports ? "amber" : undefined} />
        <Stat label="Greening trace-backs" value={openAlerts} tone={openAlerts ? "red" : undefined} sub="open or investigating" />
      </div>

      <Card
        title="Recent cases"
        actions={
          <Link href="/cases" className="text-sm text-emerald-800 hover:underline">
            All cases →
          </Link>
        }
      >
        {recent.length ? (
          <Table head={["Case", "Farmer / orchard", "AI result", "Expert", "Status"]}>
            {recent.map((c) => (
              <CaseRow key={c.id} c={c} />
            ))}
          </Table>
        ) : (
          <Empty>No cases yet.</Empty>
        )}
      </Card>
    </>
  );
}
