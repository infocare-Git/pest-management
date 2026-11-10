import Link from "next/link";
import { notFound } from "next/navigation";
import { CertBadge, FlagBadge, TestBadge } from "@/components/bits";
import { BatchTestSelect, NewBatchForm, NurseryStatusForm } from "@/components/RegistryForms";
import { Card, Empty, PageHeader, Table, Td } from "@/components/ui";
import { formatDate, ISSUE_META } from "@/lib/labels";
import { can, getActor } from "@/server/auth";
import { readDb } from "@/server/db";
import { nafha } from "@/server/nafha";

export default async function NurseryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nursery = await nafha.getNursery(id);
  if (!nursery) notFound();
  const [actor, db, batches, orchards] = await Promise.all([
    getActor(),
    readDb(),
    nafha.listBatches({ nurseryId: id }),
    nafha.listOrchards(),
  ]);
  const editable = can(actor, "manage_registry");
  const alerts = db.alerts.filter((a) => a.nurseryId === id);
  const reports = db.reports.filter((r) => r.nurseryId === id);
  const supplied = orchards.filter((o) => o.sourceNurseryId === id);

  return (
    <>
      <PageHeader
        title={nursery.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {nursery.registrationNo} · {nursery.ownerName} · {nursery.municipality}, {nursery.district}
            <CertBadge status={nursery.certification} />
            <TestBadge result={nursery.lastTestResult} />
          </span>
        }
      />

      {nursery.notes && <p className="mb-6 text-sm text-slate-700">{nursery.notes}</p>}

      <Card title="Sapling batches" className="mb-6">
        {batches.length ? (
          <Table head={["Batch code", "Variety / rootstock", "Qty", "Grafted", "Disease test", ""]}>
            {batches.map((b) => {
              const traces = alerts.filter((a) => a.batchCode === b.code).length;
              return (
                <tr key={b.id}>
                  <Td>
                    <Link href={`/verify/${b.code}`} className="font-mono text-emerald-800 hover:underline">
                      {b.code}
                    </Link>
                    {traces > 0 && <div className="text-xs font-medium text-rose-700">{traces} greening trace-back(s)</div>}
                  </Td>
                  <Td>
                    {b.variety}
                    <div className="text-xs text-slate-500">{b.rootstock}</div>
                  </Td>
                  <Td className="tabular-nums">{b.quantity}</Td>
                  <Td>{formatDate(b.propagatedOn)}</Td>
                  <Td>{editable ? <BatchTestSelect batch={b} /> : <TestBadge result={b.testResult} />}</Td>
                  <Td>
                    <Link href={`/labels/${b.code}`} className="text-sm text-emerald-800 hover:underline">
                      QR label
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty>No batches registered.</Empty>
        )}
      </Card>

      {editable && (
        <Card title="Add a batch" className="mb-6">
          <NewBatchForm nurseryId={nursery.id} />
        </Card>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="Greening trace-backs to this nursery">
          {alerts.length ? (
            <ul className="space-y-3 text-sm">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3">
                  <span>
                    <Link href={`/cases/${a.caseId}`} className="font-medium text-emerald-800 hover:underline">
                      {a.caseId}
                    </Link>{" "}
                    · orchard {a.orchardId} (planted {a.orchardPlantedYear})
                    {a.batchCode && <> · batch <span className="font-mono">{a.batchCode}</span></>}
                  </span>
                  <FlagBadge status={a.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>None.</Empty>
          )}
        </Card>
        <Card title="Farmer reports">
          {reports.length ? (
            <ul className="space-y-3 text-sm">
              {reports.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="font-medium">{r.id}</span> · {ISSUE_META[r.issue].en}
                    <span className="block text-xs text-slate-500">{r.description}</span>
                  </span>
                  <FlagBadge status={r.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>None.</Empty>
          )}
        </Card>
      </div>

      <Card title={`Orchards supplied (${supplied.length})`} className="mb-6">
        {supplied.length ? (
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {supplied.map((o) => (
              <li key={o.id}>
                {o.ownerName} · {o.municipality}-{o.ward} · planted {o.plantedYear}
                <span className="block font-mono text-xs text-slate-500">{o.saplingBatchCode ?? "batch unknown"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No NAFHA orchards are linked to this nursery.</Empty>
        )}
      </Card>

      {editable && (
        <Card title="Update certification & testing status">
          <NurseryStatusForm nursery={nursery} />
        </Card>
      )}
    </>
  );
}
