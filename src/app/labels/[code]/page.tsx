import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { PrintButton } from "@/components/SmallControls";
import { CERT_META, formatDate, TEST_META } from "@/lib/labels";
import { nafha } from "@/server/nafha";

async function baseUrl(): Promise<string> {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function LabelPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const batch = await nafha.getBatchByCode(decodeURIComponent(code));
  if (!batch) notFound();
  const nursery = await nafha.getNursery(batch.nurseryId);
  const url = `${await baseUrl()}/verify/${batch.code}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-600">
          Print and attach to each bundle or tray of saplings. The QR opens: <span className="font-mono">{url}</span>
        </p>
        <PrintButton />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex break-inside-avoid gap-4 rounded-xl border-2 border-dashed border-slate-400 bg-white p-4">
            <div className="w-32 shrink-0" dangerouslySetInnerHTML={{ __html: svg }} />
            <div className="min-w-0 text-sm">
              <div className="font-mono text-base font-bold">{batch.code}</div>
              <div className="font-semibold">{nursery?.name}</div>
              <div className="text-xs text-slate-600">Reg. {nursery?.registrationNo}</div>
              <div className="mt-1 text-xs">
                {batch.variety} / {batch.rootstock}
                <br />
                Grafted {formatDate(batch.propagatedOn)}
                <br />
                {nursery && CERT_META[nursery.certification].en} · {TEST_META[batch.testResult].en}
              </div>
              <div className="mt-2 text-xs font-semibold" lang="ne">
                किन्नुअघि स्क्यान गरी जाँच्नुहोस्
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
