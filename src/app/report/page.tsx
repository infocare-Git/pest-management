import ReportForm from "@/components/ReportForm";
import { Card, PageHeader } from "@/components/ui";
import { readDb } from "@/server/db";
import { nafha } from "@/server/nafha";

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const { batch } = await searchParams;
  const [nurseries, db] = await Promise.all([nafha.listNurseries(), readDb()]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Report suspect planting material"
        titleNe="शंकास्पद बिरुवाको उजुरी"
        description="Saplings without a label, with disease symptoms, or from an unregistered seller. Your report goes to the district authority."
      />
      <Card>
        <ReportForm
          nurseries={nurseries.map((n) => ({ id: n.id, name: n.name }))}
          initialBatch={batch}
          authority={db.settings.authorityName}
        />
      </Card>
    </div>
  );
}
