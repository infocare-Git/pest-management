import Link from "next/link";
import { CaseRow } from "@/components/bits";
import { btn, Card, Empty, PageHeader, Table } from "@/components/ui";
import { cn } from "@/lib/labels";
import { readDb } from "@/server/db";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Awaiting expert" },
  { key: "released", label: "Released" },
  { key: "greening", label: "Greening" },
  { key: "corrected", label: "AI corrected" },
] as const;

export default async function CasesPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = "all" } = await searchParams;
  const db = await readDb();
  const cases = [...db.cases]
    .filter((c) => {
      switch (f) {
        case "pending":
          return c.status === "pending_review";
        case "released":
          return c.status === "released";
        case "greening":
          return c.finalCondition === "citrus_greening" || (!c.finalCondition && c.ai.top === "citrus_greening");
        case "corrected":
          return c.review && !c.review.agreed;
        default:
          return true;
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        title="Cases"
        description="Every photo submission, with the AI result and the expert's decision."
        actions={
          <Link href="/identify" className={btn.primary}>
            New case
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={x.key === "all" ? "/cases" : `/cases?f=${x.key}`}
            className={cn(
              "rounded-full px-3 py-1 text-sm ring-1",
              f === x.key ? "bg-emerald-700 text-white ring-emerald-700" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50",
            )}
          >
            {x.label}
          </Link>
        ))}
      </div>
      <Card>
        {cases.length ? (
          <Table head={["Case", "Farmer / orchard", "AI result", "Expert", "Status"]}>
            {cases.map((c) => (
              <CaseRow key={c.id} c={c} />
            ))}
          </Table>
        ) : (
          <Empty>No cases match this filter.</Empty>
        )}
      </Card>
    </>
  );
}
