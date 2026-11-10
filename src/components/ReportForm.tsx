"use client";

import { useState } from "react";
import type { FarmerReport, Nursery, ReportIssue } from "@/lib/types";
import { send } from "@/lib/client";
import { ISSUE_META } from "@/lib/labels";
import PhotoInput, { type PickedPhoto } from "./PhotoInput";
import { btn, Field, inputClass, Notice } from "./ui";

export default function ReportForm({
  nurseries,
  initialBatch,
  authority,
}: {
  nurseries: Pick<Nursery, "id" | "name">[];
  initialBatch?: string;
  authority: string;
}) {
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<FarmerReport | null>(null);

  if (sent) {
    return (
      <Notice tone="green">
        <p className="font-semibold">उजुरी पठाइयो · Report sent</p>
        <p className="mt-1">
          Reference number <strong>{sent.id}</strong>. It has been flagged to {sent.authority}. Keep the
          saplings and any receipt until an officer contacts you.
        </p>
        <p className="mt-1" lang="ne">
          तपाईंको उजुरी सम्बन्धित निकायमा पठाइएको छ। अधिकारीले सम्पर्क नगरेसम्म बिरुवा र बिल सुरक्षित राख्नुहोस्।
        </p>
      </Notice>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const fd = new FormData(e.currentTarget);
          photos.forEach((p, i) => fd.append("photos", p.blob, `photo-${i + 1}.jpg`));
          setSent(await send<FarmerReport>("/api/reports", "POST", fd));
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Batch code on the label · ब्याच कोड" hint="Leave empty if there was no label.">
          <input name="batchCode" defaultValue={initialBatch} className={`${inputClass} font-mono uppercase`} />
        </Field>
        <Field label="Nursery (if known) · नर्सरी">
          <select name="nurseryId" className={inputClass} defaultValue="">
            <option value="">Don&apos;t know / not listed</option>
            {nurseries.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Seller name / place (if not listed)" className="sm:col-span-2">
          <input name="sellerText" className={inputClass} placeholder="e.g. trader at Waling haat bazaar" />
        </Field>
        <Field label="What is the problem? · समस्या">
          <select name="issue" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {(Object.keys(ISSUE_META) as ReportIssue[]).map((k) => (
              <option key={k} value={k}>
                {ISSUE_META[k].ne} · {ISSUE_META[k].en}
              </option>
            ))}
          </select>
        </Field>
        <div />
        <Field label="Describe it · विवरण" className="sm:col-span-2">
          <textarea
            name="description"
            required
            rows={3}
            className={inputClass}
            placeholder="When did you buy, how many saplings, what you see"
          />
        </Field>
        <Field label="Your name · तपाईंको नाम">
          <input name="reporterName" required className={inputClass} />
        </Field>
        <Field label="Phone · फोन">
          <input name="reporterPhone" className={inputClass} inputMode="tel" />
        </Field>
      </div>
      <div>
        <div className="mb-2 text-sm font-medium text-slate-700">Photos (optional) · फोटो</div>
        <PhotoInput photos={photos} onChange={setPhotos} />
      </div>
      <p className="text-xs text-slate-500">This report will be sent to: {authority}</p>
      {error && <Notice tone="red">{error}</Notice>}
      <button className={btn.danger} disabled={busy}>
        {busy ? "Sending…" : "Send report · उजुरी पठाउनुहोस्"}
      </button>
    </form>
  );
}
