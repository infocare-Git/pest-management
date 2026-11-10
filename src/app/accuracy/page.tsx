import Link from "next/link";
import { Card, Notice, PageHeader, Stat, Table, Td } from "@/components/ui";
import { CONDITIONS, MODEL_CLASSES } from "@/lib/catalog";
import { cn, pct } from "@/lib/labels";
import { readDb } from "@/server/db";
import { computeValidation } from "@/server/services";

function Progress({ label, value, target, fmt }: { label: string; value: number; target: number; fmt: (n: number) => string }) {
  const ratio = target > 0 ? Math.min(1, value / target) : 1;
  const met = value >= target;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className={cn("tabular-nums", met ? "text-emerald-700" : "text-slate-500")}>
          {fmt(value)} / {fmt(target)}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100">
        <div className={cn("h-2.5 rounded-full", met ? "bg-emerald-600" : "bg-amber-500")} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

export default async function AccuracyPage() {
  const db = await readDb();
  const s = db.settings;
  const v = computeValidation(db);
  const max = Math.max(1, ...Object.values(v.confusion).flatMap((r) => Object.values(r)));

  return (
    <>
      <PageHeader
        title="AI accuracy & validation"
        description="Every expert decision is compared with the AI result. The agreed threshold decides when experts can stop checking every case."
      />

      <div className="mb-6">
        {s.mode === "graduated" ? (
          <Notice tone="green">The model has graduated. Experts now review low-confidence results, greening detections and spot checks.</Notice>
        ) : v.thresholdMet ? (
          <Notice tone="green">
            The threshold is met. A NAFHA admin can switch to graduated mode in{" "}
            <Link href="/settings" className="underline">pilot settings</Link>.
          </Notice>
        ) : (
          <Notice tone="amber">
            Still in validation. Remaining: {v.gaps.join(" · ")}.
          </Notice>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Reviewed cases" value={v.reviewed} sub={`excluding unusable photos`} />
        <Stat label="Overall accuracy" value={pct(v.accuracy, 1)} tone={v.accuracy !== null && v.accuracy >= s.accuracyThreshold ? "green" : "amber"} />
        <Stat label="Greening accuracy" value={pct(v.greeningAccuracy, 1)} sub={`${v.greeningCorrect}/${v.greeningReviewed} greening cases detected`} tone={v.greeningAccuracy !== null && v.greeningAccuracy >= s.accuracyThreshold ? "green" : "amber"} />
        <Stat label="Agreed threshold" value={pct(s.accuracyThreshold)} />
      </div>

      <Card title="Progress toward the threshold" className="mb-6">
        <div className="space-y-4">
          <Progress label="Expert-reviewed cases" value={v.reviewed} target={s.minReviewedCases} fmt={String} />
          <Progress label="Reviewed greening cases" value={v.greeningReviewed} target={s.minGreeningCases} fmt={String} />
          <Progress label="Overall accuracy" value={v.accuracy ?? 0} target={s.accuracyThreshold} fmt={(n) => pct(n, 1)} />
          <Progress label="Greening accuracy (sensitivity)" value={v.greeningAccuracy ?? 0} target={s.accuracyThreshold} fmt={(n) => pct(n, 1)} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="By condition">
          <Table head={["Condition", "Expert cases", "AI caught", "AI precision"]}>
            {v.perCondition.map((p) => (
              <tr key={p.condition}>
                <Td>{CONDITIONS[p.condition].nameEn}</Td>
                <Td className="tabular-nums">{p.n}</Td>
                <Td className="tabular-nums">{pct(p.recall)}</Td>
                <Td className="tabular-nums">{pct(p.precision)}</Td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-slate-500">
            AI caught = share of expert-labelled cases the AI got right. AI precision = share of AI calls the expert confirmed.
          </p>
        </Card>

        <Card title="Confusion matrix (rows: expert, columns: AI)">
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="text-xs">
              <thead>
                <tr>
                  <th />
                  {MODEL_CLASSES.map((c) => (
                    <th key={c} className="px-1 pb-1 font-medium text-slate-500" title={CONDITIONS[c].nameEn}>
                      {abbr(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODEL_CLASSES.map((row) => (
                  <tr key={row}>
                    <th className="whitespace-nowrap pr-2 text-right font-medium text-slate-600">{CONDITIONS[row].nameEn}</th>
                    {MODEL_CLASSES.map((col) => {
                      const n = v.confusion[row]?.[col] ?? 0;
                      const diag = row === col;
                      return (
                        <td key={col} className="p-0.5">
                          <div
                            className={cn(
                              "flex h-9 w-11 items-center justify-center rounded tabular-nums",
                              n === 0 ? "bg-slate-50 text-slate-300" : diag ? "text-white" : "text-rose-950",
                            )}
                            style={
                              n
                                ? { backgroundColor: diag ? `rgba(4,120,87,${0.35 + 0.65 * (n / max)})` : `rgba(244,63,94,${0.15 + 0.6 * (n / max)})` }
                                : undefined
                            }
                          >
                            {n}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Green diagonal = agreement. Red cells = AI mistakes. Most important: greening missed by the AI (top row, off-diagonal).</p>
        </Card>
      </div>
    </>
  );
}

function abbr(c: string): string {
  return { citrus_greening: "HLB", citrus_psyllid: "Psy", fruit_fly: "FF", citrus_canker: "Can", gummosis: "Gum", healthy: "OK" }[c] ?? c;
}
