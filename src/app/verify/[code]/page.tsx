import Link from "next/link";
import { CertBadge, TestBadge } from "@/components/bits";
import { VerifySearch } from "@/components/SmallControls";
import { btn, Card } from "@/components/ui";
import { cn, formatDate } from "@/lib/labels";
import { verifyBatch } from "@/server/services";

const VERDICT = {
  ok: { en: "Safe to buy", ne: "किन्न सुरक्षित", cls: "bg-emerald-700 text-white", icon: "✔" },
  caution: { en: "Buy with caution", ne: "सावधानीसाथ मात्र किन्नुहोस्", cls: "bg-amber-400 text-amber-950", icon: "!" },
  warning: { en: "Do not buy", ne: "नकिन्नुहोस्", cls: "bg-rose-700 text-white", icon: "✖" },
};

export default async function VerifyResult({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const v = await verifyBatch(decodeURIComponent(code));
  const meta = VERDICT[v.verdict];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className={cn("rounded-2xl p-6 shadow-sm", meta.cls)}>
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-3xl font-bold">
            {meta.icon}
          </span>
          <div>
            <div className="text-2xl font-bold" lang="ne">
              {meta.ne}
            </div>
            <div className="text-sm opacity-90">
              {meta.en} · batch <span className="font-mono">{v.code}</span>
            </div>
          </div>
        </div>
      </div>

      <Card title="Why · किन">
        <ul className="space-y-3">
          {v.reasons.map((r) => (
            <li key={r.en} className="flex gap-3">
              <span
                className={cn(
                  "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                  r.tone === "green" ? "bg-emerald-600" : r.tone === "amber" ? "bg-amber-500" : "bg-rose-600",
                )}
              />
              <span>
                <span className="block font-medium text-slate-900" lang="ne">
                  {r.ne}
                </span>
                <span className="text-sm text-slate-600">{r.en}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {v.nursery && v.batch && (
        <Card title="Source · स्रोत">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Item k="Nursery" v={v.nursery.name} />
            <Item k="Registration no." v={v.nursery.registrationNo} />
            <Item k="Location" v={`${v.nursery.municipality}, ${v.nursery.district}`} />
            <Item k="Certification" v={<CertBadge status={v.nursery.certification} ne />} />
            <Item k="Certificate valid until" v={formatDate(v.nursery.certificationExpiry)} />
            <Item k="Batch test" v={<TestBadge result={v.batch.testResult} ne />} />
            <Item k="Variety / rootstock" v={`${v.batch.variety} on ${v.batch.rootstock}`} />
            <Item k="Grafted on" v={formatDate(v.batch.propagatedOn)} />
          </dl>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={`/report?batch=${encodeURIComponent(v.code)}`} className={btn.danger}>
          Report a problem · उजुरी
        </Link>
        <Link href="/verify" className={btn.secondary}>
          Check another
        </Link>
      </div>

      <Card>
        <VerifySearch />
      </Card>
    </div>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{v}</dd>
    </div>
  );
}
