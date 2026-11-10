import Link from "next/link";
import { CertBadge, TestBadge } from "@/components/bits";
import { NewNurseryForm } from "@/components/RegistryForms";
import { Badge, Card, PageHeader, Table, Td } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { can, getActor } from "@/server/auth";
import { readDb } from "@/server/db";
import { nafha } from "@/server/nafha";

export default async function NurseriesPage() {
  const [actor, db, nurseries, batches] = await Promise.all([
    getActor(),
    readDb(),
    nafha.listNurseries(),
    nafha.listBatches(),
  ]);
  const active = (s: string) => s === "open" || s === "investigating";

  return (
    <>
      <PageHeader
        title="Nursery registry"
        description="Certification and disease-testing status of each nursery, stored in the NAFHA orchard database."
      />
      <Card className="mb-6">
        <Table head={["Nursery", "Certification", "Last disease test", "Batches", "Flags"]}>
          {nurseries.map((n) => {
            const flags =
              db.reports.filter((r) => r.nurseryId === n.id && active(r.status)).length +
              db.alerts.filter((a) => a.nurseryId === n.id && active(a.status)).length;
            return (
              <tr key={n.id} className="hover:bg-slate-50">
                <Td>
                  <Link href={`/nurseries/${n.id}`} className="font-medium text-emerald-800 hover:underline">
                    {n.name}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {n.registrationNo} · {n.municipality} · code {n.code}
                  </div>
                </Td>
                <Td>
                  <CertBadge status={n.certification} />
                  {n.certificationExpiry && (
                    <div className="text-xs text-slate-500">until {formatDate(n.certificationExpiry)}</div>
                  )}
                </Td>
                <Td>
                  <TestBadge result={n.lastTestResult} />
                  <div className="text-xs text-slate-500">{formatDate(n.lastTestDate)}</div>
                </Td>
                <Td className="tabular-nums">{batches.filter((b) => b.nurseryId === n.id).length}</Td>
                <Td>{flags ? <Badge tone="red">{flags} open</Badge> : <span className="text-slate-400">—</span>}</Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      {can(actor, "manage_registry") && (
        <Card title="Register a nursery">
          <NewNurseryForm district={db.settings.pilotDistrict} />
        </Card>
      )}
    </>
  );
}
