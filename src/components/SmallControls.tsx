"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FlagStatus, Settings } from "@/lib/types";
import { send } from "@/lib/client";
import { FLAG_META } from "@/lib/labels";
import { btn, Field, inputClass, Notice } from "./ui";

export function FlagControl({
  kind,
  id,
  status,
  note,
}: {
  kind: "report" | "alert";
  id: string;
  status: FlagStatus;
  note?: string;
}) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [n, setN] = useState(note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = s !== status || n !== (note ?? "");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <select
        value={s}
        onChange={(e) => setS(e.target.value as FlagStatus)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
      >
        {(Object.keys(FLAG_META) as FlagStatus[]).map((k) => (
          <option key={k} value={k}>
            {FLAG_META[k].en}
          </option>
        ))}
      </select>
      <input
        value={n}
        onChange={(e) => setN(e.target.value)}
        placeholder="Action taken / note"
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
      <button
        className={btn.secondary}
        disabled={!dirty || busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await send(`/api/flags/${kind}/${id}`, "PATCH", { status: s, note: n });
            router.refresh();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saving…" : "Update"}
      </button>
      {error && <span className="text-xs text-rose-700">{error}</span>}
    </div>
  );
}

export function SettingsForm({ settings, canEdit }: { settings: Settings; canEdit: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const num = (k: string) => Number(fd.get(k));
        setBusy(true);
        setMsg(null);
        try {
          await send("/api/settings", "PATCH", {
            pilotDistrict: String(fd.get("pilotDistrict")),
            authorityName: String(fd.get("authorityName")),
            mode: String(fd.get("mode")),
            accuracyThreshold: num("accuracyThreshold") / 100,
            minReviewedCases: num("minReviewedCases"),
            minGreeningCases: num("minGreeningCases"),
            spotCheckRate: num("spotCheckRate") / 100,
            autoReleaseMinConfidence: num("autoReleaseMinConfidence") / 100,
            newOrchardYears: num("newOrchardYears"),
          });
          setMsg({ tone: "green", text: "Settings saved" });
          router.refresh();
        } catch (err) {
          setMsg({ tone: "red", text: (err as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={!canEdit} className="contents">
        <Field label="Pilot district">
          <input name="pilotDistrict" className={inputClass} defaultValue={settings.pilotDistrict} />
        </Field>
        <Field label="Authority that receives flags">
          <input name="authorityName" className={inputClass} defaultValue={settings.authorityName} />
        </Field>
        <Field
          label="Review mode"
          hint="Graduation is only allowed once the accuracy threshold is met."
        >
          <select name="mode" className={inputClass} defaultValue={settings.mode}>
            <option value="validation">Validation: expert checks every result</option>
            <option value="graduated">Graduated: low-confidence, greening & spot checks only</option>
          </select>
        </Field>
        <Field label="Agreed accuracy threshold (%)">
          <input name="accuracyThreshold" type="number" min={0} max={100} step={1} className={inputClass} defaultValue={Math.round(settings.accuracyThreshold * 100)} />
        </Field>
        <Field label="Minimum reviewed cases">
          <input name="minReviewedCases" type="number" min={0} className={inputClass} defaultValue={settings.minReviewedCases} />
        </Field>
        <Field label="Minimum reviewed greening cases">
          <input name="minGreeningCases" type="number" min={0} className={inputClass} defaultValue={settings.minGreeningCases} />
        </Field>
        <Field label="Spot-check rate after graduation (%)">
          <input name="spotCheckRate" type="number" min={0} max={100} className={inputClass} defaultValue={Math.round(settings.spotCheckRate * 100)} />
        </Field>
        <Field label="Always review below AI confidence (%)">
          <input name="autoReleaseMinConfidence" type="number" min={0} max={100} className={inputClass} defaultValue={Math.round(settings.autoReleaseMinConfidence * 100)} />
        </Field>
        <Field label="'New orchard' for nursery trace-back (years)">
          <input name="newOrchardYears" type="number" min={0} className={inputClass} defaultValue={settings.newOrchardYears} />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button className={btn.primary} disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
          {!canEdit && <span className="text-sm text-slate-500">Switch to the NAFHA admin role to edit.</span>}
        </div>
      </fieldset>
      {msg && (
        <div className="sm:col-span-2">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}
    </form>
  );
}

export function ResetButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={btn.danger}
      disabled={busy}
      onClick={async () => {
        if (!confirm("Delete all pilot data and reload the sample data?")) return;
        setBusy(true);
        try {
          await send("/api/settings/reset", "POST");
          router.refresh();
        } catch (err) {
          alert((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Resetting…" : "Reset to sample data"}
    </button>
  );
}

export function VerifySearch({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initial);
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) router.push(`/verify/${encodeURIComponent(code.trim().toUpperCase())}`);
      }}
    >
      <Field label="Batch code on the sapling label · ब्याच कोड" className="flex-1">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. SYA-N01-2507-01"
          className={`${inputClass} font-mono text-base uppercase`}
          autoCapitalize="characters"
        />
      </Field>
      <button className={`${btn.primary} sm:self-end`}>Check · जाँच्नुहोस्</button>
    </form>
  );
}

export function PrintButton() {
  return (
    <button className={`${btn.primary} print:hidden`} onClick={() => window.print()}>
      Print label
    </button>
  );
}
