import IdentifyForm from "@/components/IdentifyForm";
import { Card, Notice, PageHeader } from "@/components/ui";
import { readDb } from "@/server/db";
import { nafha } from "@/server/nafha";

export default async function IdentifyPage() {
  const [orchards, db] = await Promise.all([nafha.listOrchards(), readDb()]);
  return (
    <>
      <PageHeader
        title="Check a tree"
        titleNe="बोट जाँच"
        description="Photograph the symptoms. The AI suggests what it is; an expert confirms it during the pilot."
      />
      {db.settings.mode === "validation" && (
        <div className="mb-4">
          <Notice tone="amber">
            During the pilot, an expert checks every result before advice is given. You will see the
            result on the case page once it is checked.
          </Notice>
        </div>
      )}
      <Card>
        <IdentifyForm orchards={orchards} />
      </Card>
    </>
  );
}
