import Link from "next/link";
import { FlagBadge, Photo } from "@/components/bits";
import { FlagControl } from "@/components/SmallControls";
import { Card, Empty, Notice, PageHeader } from "@/components/ui";
import { formatDate, ISSUE_META } from "@/lib/labels";
import { can, getActor } from "@/server/auth";
import { readDb } from "@/server/db";

const ORDER = { open: 0, investigating: 1, resolved: 2, dismissed: 3 };

export default async function FlagsPage() {
  const [actor, db] = await Promise.all([getActor(), readDb()]);
  const canAct = can(actor, "handle_flags");
  const nurseryName = (id?: string) => db.nafha.nurseries.find((n) => n.id === id)?.name;
  const alerts = [...db.alerts].sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.createdAt.localeCompare(a.createdAt));
  const reports = [...db.reports].sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        title="Flags & trace-backs"
        description={`Inbox for ${db.settings.authorityName}: greening traced to nurseries, and farmer reports of suspect planting material.`}
      />
      {!canAct && (
        <div className="mb-4">
          <Notice tone="amber">Switch to the authority role in the sidebar to update flags.</Notice>
        </div>
      )}

      <Card title="Greening trace-backs (from Module 1)" className="mb-6">
        {alerts.length ? (
          <ul className="divide-y divide-slate-100">
            {alerts.map((a) => (
              <li key={a.id} className="space-y-2 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-900">
                      {a.id} · greening in orchard {a.orchardId} (planted {a.orchardPlantedYear})
                    </div>
                    <div className="text-sm text-slate-600">
                      Source:{" "}
                      {a.nurseryId ? (
                        <Link href={`/nurseries/${a.nurseryId}`} className="text-emerald-800 underline">
                          {nurseryName(a.nurseryId) ?? a.nurseryId}
                        </Link>
                      ) : (
                        "unknown"
                      )}
                      {a.batchCode && <> · batch <span className="font-mono">{a.batchCode}</span></>} · case{" "}
                      <Link href={`/cases/${a.caseId}`} className="text-emerald-800 underline">
                        {a.caseId}
                      </Link>{" "}
                      · {formatDate(a.createdAt)}
                    </div>
                  </div>
                  <FlagBadge status={a.status} />
                </div>
                {canAct ? (
                  <FlagControl kind="alert" id={a.id} status={a.status} note={a.note} />
                ) : (
                  a.note && <p className="text-sm text-slate-600">{a.note}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No trace-backs.</Empty>
        )}
      </Card>

      <Card title="Farmer reports">
        {reports.length ? (
          <ul className="divide-y divide-slate-100">
            {reports.map((r) => (
              <li key={r.id} className="space-y-2 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-900">
                      {r.id} · {ISSUE_META[r.issue].en}
                    </div>
                    <div className="text-sm text-slate-600">
                      {r.reporterName}
                      {r.reporterPhone && ` (${r.reporterPhone})`} · {formatDate(r.createdAt)}
                      {r.batchCode && <> · batch <span className="font-mono">{r.batchCode}</span></>}
                      {r.nurseryId && <> · {nurseryName(r.nurseryId)}</>}
                      {r.sellerText && <> · seller: {r.sellerText}</>}
                    </div>
                    <p className="mt-1 text-sm text-slate-800">{r.description}</p>
                  </div>
                  <FlagBadge status={r.status} />
                </div>
                {r.photos.length > 0 && (
                  <div className="grid max-w-md grid-cols-4 gap-2">
                    {r.photos.map((p, i) => (
                      <Photo key={p} name={p} alt={`Report photo ${i + 1}`} />
                    ))}
                  </div>
                )}
                {canAct ? (
                  <FlagControl kind="report" id={r.id} status={r.status} note={r.resolutionNote} />
                ) : (
                  r.resolutionNote && <p className="text-sm text-slate-600">{r.resolutionNote}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No reports.</Empty>
        )}
      </Card>
    </>
  );
}
