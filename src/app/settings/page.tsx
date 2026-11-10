import { ResetButton, SettingsForm } from "@/components/SmallControls";
import { Card, PageHeader } from "@/components/ui";
import { can, getActor } from "@/server/auth";
import { readDb } from "@/server/db";

export default async function SettingsPage() {
  const [actor, db] = await Promise.all([getActor(), readDb()]);
  const admin = can(actor, "admin");
  return (
    <>
      <PageHeader title="Pilot settings" description="Validation threshold, review rules and routing of flags." />
      <Card title="Rules" className="mb-6">
        <SettingsForm settings={db.settings} canEdit={admin} />
      </Card>
      <Card title="Integrations">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium">Classifier</dt>
            <dd className="text-slate-600">
              {process.env.CLASSIFIER_URL ? `Remote model at ${process.env.CLASSIFIER_URL}` : "Demo classifier (not a real model). Set CLASSIFIER_URL to use a trained model."}
            </dd>
          </div>
          <div>
            <dt className="font-medium">NAFHA orchard database</dt>
            <dd className="text-slate-600">Mock adapter (src/server/nafha.ts) backed by data/db.json.</dd>
          </div>
        </dl>
        {admin && (
          <div className="mt-5 border-t border-slate-200 pt-5">
            <ResetButton />
          </div>
        )}
      </Card>
    </>
  );
}
