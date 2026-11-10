import { existsSync } from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStatusBadge, ConditionBadge, FlagBadge, Photo } from "@/components/bits";
import ReviewForm from "@/components/ReviewForm";
import { Card, Notice, PageHeader } from "@/components/ui";
import VoiceGuidance from "@/components/VoiceGuidance";
import { CONDITIONS } from "@/lib/catalog";
import { formatDate, pct } from "@/lib/labels";
import { can, getActor } from "@/server/auth";
import { readDb } from "@/server/db";
import { nafha } from "@/server/nafha";

function audioFor(condition: string): string | null {
  const file = path.join(process.cwd(), "public", "audio", `${condition}.mp3`);
  return existsSync(file) ? `/audio/${condition}.mp3` : null;
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [db, actor] = await Promise.all([readDb(), getActor()]);
  const c = db.cases.find((x) => x.id === id);
  if (!c) notFound();
  const orchard = c.orchardId ? await nafha.getOrchard(c.orchardId) : null;
  const alert = db.alerts.find((a) => a.caseId === c.id);
  const alertNursery = alert?.nurseryId ? await nafha.getNursery(alert.nurseryId) : null;
  const final = c.finalCondition ? CONDITIONS[c.finalCondition] : null;

  return (
    <>
      <PageHeader
        title={`Case ${c.id}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {formatDate(c.createdAt)} · submitted by {c.submittedBy} <CaseStatusBadge c={c} />
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {final ? (
            <Card title="Diagnosis & guidance · निदान र सल्लाह">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-slate-900">{final.nameNe}</span>
                <ConditionBadge id={final.id} />
                {c.review && (
                  <span className="text-xs text-slate-500">
                    {c.review.agreed ? "Confirmed" : "Diagnosed"} by {c.review.expertName}
                  </span>
                )}
              </div>
              <VoiceGuidance text={final.voiceNe} audioSrc={audioFor(final.id)} />
              {final.actionsEn.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">What to do (English)</h3>
                  <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
                    {final.actionsEn.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ol>
                </div>
              )}
              {c.review?.note && (
                <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <strong>Expert note:</strong> {c.review.note}
                </p>
              )}
            </Card>
          ) : (
            <Notice tone="amber">
              <p className="font-semibold">Awaiting expert check · विज्ञ जाँच बाँकी</p>
              <p className="mt-1">
                Do not act on the AI suggestion yet. Guidance in Nepali will appear here once an expert has
                checked the photos. Reason: {c.reviewReason}.
              </p>
            </Notice>
          )}

          {alert && (
            <Notice tone="red">
              <p className="font-semibold">Traced to source nursery</p>
              <p className="mt-1">
                Greening in a new orchard (planted {alert.orchardPlantedYear}) has been flagged to{" "}
                {alert.authority}.{" "}
                {alertNursery ? (
                  <>
                    Source:{" "}
                    <Link href={`/nurseries/${alertNursery.id}`} className="underline">
                      {alertNursery.name}
                    </Link>
                    {alert.batchCode && <>, batch <span className="font-mono">{alert.batchCode}</span></>}.
                  </>
                ) : (
                  "Source nursery unknown. Collect purchase details from the farmer."
                )}{" "}
                Status: <FlagBadge status={alert.status} />
              </p>
            </Notice>
          )}

          {!c.review && c.reviewRequired && can(actor, "review") && (
            <Card title="Expert review">
              <ReviewForm caseId={c.id} aiTop={c.ai.top} />
            </Card>
          )}

          <Card title="Photos">
            {c.photos.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {c.photos.map((p, i) => (
                  <Photo key={p} name={p} alt={`Case photo ${i + 1}`} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sample record: no photos stored.</p>
            )}
            {c.notes && <p className="mt-3 text-sm text-slate-700">“{c.notes}”</p>}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title={c.finalCondition ? "AI result (for the record)" : "AI suggestion (not confirmed)"}>
            <ul className="space-y-3">
              {c.ai.predictions.map((p) => (
                <li key={p.condition}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{CONDITIONS[p.condition].nameEn}</span>
                    <span className="tabular-nums text-slate-500">{pct(p.confidence)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${p.confidence * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">Model: {c.ai.model}</p>
          </Card>

          <Card title="Farmer & orchard">
            <dl className="space-y-2 text-sm">
              <Row k="Farmer" v={c.farmerName} />
              {c.farmerPhone && <Row k="Phone" v={c.farmerPhone} />}
              {orchard ? (
                <>
                  <Row k="NAFHA orchard" v={orchard.id} />
                  <Row k="Location" v={`${orchard.municipality}-${orchard.ward}, ${orchard.district}`} />
                  <Row k="Trees / planted" v={`${orchard.treeCount} trees · ${orchard.plantedYear}`} />
                  <Row k="Sapling batch" v={orchard.saplingBatchCode ?? "Unknown"} />
                </>
              ) : (
                <Row k="Orchard" v="Not linked to NAFHA database" />
              )}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium text-slate-800">{v}</dd>
    </div>
  );
}
