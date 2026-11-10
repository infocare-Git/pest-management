"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ConditionId } from "@/lib/types";
import { ALL_CONDITIONS, CONDITIONS } from "@/lib/catalog";
import { send } from "@/lib/client";
import { cn } from "@/lib/labels";
import { btn, Field, inputClass, Notice } from "./ui";

export default function ReviewForm({ caseId, aiTop }: { caseId: string; aiTop: ConditionId }) {
  const router = useRouter();
  const [condition, setCondition] = useState<ConditionId>(aiTop);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send(`/api/cases/${caseId}/review`, "POST", { condition, note });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const agrees = condition === aiTop;

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Your diagnosis</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ALL_CONDITIONS.map((id) => (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                condition === id ? "border-emerald-600 bg-emerald-50" : "border-slate-200 hover:bg-slate-50",
              )}
            >
              <input
                type="radio"
                name="condition"
                value={id}
                checked={condition === id}
                onChange={() => setCondition(id)}
                className="mt-0.5 accent-emerald-700"
              />
              <span>
                {CONDITIONS[id].nameEn}
                {id === aiTop && <span className="ml-1 text-xs text-slate-500">(AI)</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Note for the record (optional)">
        <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {error && <Notice tone="red">{error}</Notice>}
      <button type="submit" className={agrees ? btn.primary : btn.danger} disabled={busy}>
        {busy ? "Saving…" : agrees ? "Confirm AI result & release guidance" : "Correct AI result & release guidance"}
      </button>
    </form>
  );
}
