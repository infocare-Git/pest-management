import Link from "next/link";
import { Card, Notice, PageHeader, Table, Td } from "@/components/ui";
import { readDb } from "@/server/db";
import { nafha } from "@/server/nafha";

export default async function OrchardsPage() {
  const [orchards, nurseries, db] = await Promise.all([nafha.listOrchards(), nafha.listNurseries(), readDb()]);
  const year = new Date().getFullYear();

  return (
    <>
      <PageHeader
        title="Orchards"
        description="Read from the NAFHA orchard database. This app links cases and trace-backs to these records and does not keep its own copy."
      />
      <div className="mb-4">
        <Notice tone="blue">
          Running on the mock NAFHA adapter with sample records. See README › “Connecting the NAFHA database”.
        </Notice>
      </div>
      <Card>
        <Table head={["Orchard", "Location", "Trees", "Planted", "Source nursery / batch", "Cases"]}>
          {orchards.map((o) => {
            const cases = db.cases.filter((c) => c.orchardId === o.id);
            const greening = cases.some((c) => c.finalCondition === "citrus_greening");
            const nursery = nurseries.find((n) => n.id === o.sourceNurseryId);
            return (
              <tr key={o.id}>
                <Td>
                  <div className="font-medium">{o.ownerName}</div>
                  <div className="font-mono text-xs text-slate-500">{o.id}</div>
                </Td>
                <Td>
                  {o.municipality}-{o.ward}
                </Td>
                <Td className="tabular-nums">{o.treeCount}</Td>
                <Td>
                  {o.plantedYear}
                  {year - o.plantedYear <= db.settings.newOrchardYears && (
                    <span className="ml-1 text-xs text-sky-700">new</span>
                  )}
                </Td>
                <Td>
                  {nursery ? (
                    <Link href={`/nurseries/${nursery.id}`} className="text-emerald-800 hover:underline">
                      {nursery.name}
                    </Link>
                  ) : (
                    <span className="text-slate-400">Unknown</span>
                  )}
                  {o.saplingBatchCode && <div className="font-mono text-xs text-slate-500">{o.saplingBatchCode}</div>}
                </Td>
                <Td>
                  {cases.length}
                  {greening && <span className="ml-1 text-xs font-medium text-rose-700">greening</span>}
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
