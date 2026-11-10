import Link from "next/link";
import { ConditionBadge } from "@/components/bits";
import { Card, Empty, Notice, PageHeader } from "@/components/ui";
import { formatDate, pct } from "@/lib/labels";
import { can, getActor } from "@/server/auth";
import { readDb } from "@/server/db";

export default async function ReviewQueue() {
  const [actor, db] = await Promise.all([getActor(), readDb()]);
  // Greening first (it triggers nursery trace-back), then oldest first.
  const queue = db.cases
    .filter((c) => c.status === "pending_review")
    .sort((a, b) => {
      const g = Number(b.ai.top === "citrus_greening") - Number(a.ai.top === "citrus_greening");
      return g || a.createdAt.localeCompare(b.createdAt);
    });

  return (
    <>
      <PageHeader
        title="Expert review queue"
        description="Confirm or correct each AI result. Guidance reaches the farmer only after your decision."
      />
      {!can(actor, "review") && (
        <div className="mb-4">
          <Notice tone="amber">Switch to the expert role in the sidebar to review cases.</Notice>
        </div>
      )}
      <Card title={`${queue.length} waiting`}>
        {queue.length ? (
          <ul className="divide-y divide-slate-100">
            {queue.map((c) => (
              <li key={c.id}>
                <Link href={`/cases/${c.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-slate-50">
                  <div>
                    <div className="font-medium text-slate-900">
                      {c.id} · {c.farmerName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(c.createdAt)} · {c.photos.length} photo(s) · {c.reviewReason}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    AI: <ConditionBadge id={c.ai.top} /> {pct(c.ai.confidence)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nothing to review.</Empty>
        )}
      </Card>
    </>
  );
}
