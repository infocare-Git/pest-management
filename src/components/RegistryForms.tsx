"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CertificationStatus, Nursery, SaplingBatch, TestResult } from "@/lib/types";
import { send } from "@/lib/client";
import { CERT_META, TEST_META } from "@/lib/labels";
import { btn, Field, inputClass, Notice } from "./ui";

function useSubmit() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  async function run(fn: () => Promise<unknown>, okMessage: string) {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      await fn();
      setDone(okMessage);
      router.refresh();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, done, run };
}

function formValues(form: HTMLFormElement): Record<string, string> {
  return Object.fromEntries(
    [...new FormData(form).entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]),
  );
}

function CertFields({ n }: { n?: Nursery }) {
  return (
    <>
      <Field label="Certification status">
        <select name="certification" className={inputClass} defaultValue={n?.certification ?? "not_certified"}>
          {(Object.keys(CERT_META) as CertificationStatus[]).map((k) => (
            <option key={k} value={k}>
              {CERT_META[k].en}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Certificate valid until">
        <input type="date" name="certificationExpiry" className={inputClass} defaultValue={n?.certificationExpiry} />
      </Field>
      <Field label="Certifying body">
        <input name="certifyingBody" className={inputClass} defaultValue={n?.certifyingBody} />
      </Field>
      <Field label="Last disease test result">
        <select name="lastTestResult" className={inputClass} defaultValue={n?.lastTestResult ?? "not_tested"}>
          {(Object.keys(TEST_META) as TestResult[]).map((k) => (
            <option key={k} value={k}>
              {TEST_META[k].en}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Last test date">
        <input type="date" name="lastTestDate" className={inputClass} defaultValue={n?.lastTestDate} />
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea name="notes" rows={2} className={inputClass} defaultValue={n?.notes} />
      </Field>
    </>
  );
}

export function NewNurseryForm({ district }: { district: string }) {
  const s = useSubmit();
  const router = useRouter();
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const v = formValues(e.currentTarget);
        let created: Nursery | null = null;
        const ok = await s.run(async () => {
          created = await send<Nursery>("/api/nurseries", "POST", { ...v, district });
        }, "Nursery registered");
        if (ok && created) router.push(`/nurseries/${(created as Nursery).id}`);
      }}
    >
      <Field label="Nursery name">
        <input name="name" required className={inputClass} />
      </Field>
      <Field label="Short code" hint="Prefix for batch codes, e.g. SYA-N06">
        <input name="code" required className={inputClass} placeholder="SYA-N06" />
      </Field>
      <Field label="Government registration no.">
        <input name="registrationNo" required className={inputClass} />
      </Field>
      <Field label="Owner">
        <input name="ownerName" required className={inputClass} />
      </Field>
      <Field label="Phone">
        <input name="phone" className={inputClass} inputMode="tel" />
      </Field>
      <Field label="Municipality">
        <input name="municipality" className={inputClass} />
      </Field>
      <CertFields />
      <div className="sm:col-span-2">
        {s.error && <Notice tone="red">{s.error}</Notice>}
        <button className={`${btn.primary} mt-2`} disabled={s.busy}>
          {s.busy ? "Saving…" : "Register nursery"}
        </button>
      </div>
    </form>
  );
}

export function NurseryStatusForm({ nursery }: { nursery: Nursery }) {
  const s = useSubmit();
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const v = formValues(e.currentTarget);
        s.run(() => send(`/api/nurseries/${nursery.id}`, "PATCH", v), "Saved to NAFHA registry");
      }}
    >
      <CertFields n={nursery} />
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className={btn.primary} disabled={s.busy}>
          {s.busy ? "Saving…" : "Save status"}
        </button>
        {s.done && <span className="text-sm text-emerald-700">{s.done}</span>}
        {s.error && <span className="text-sm text-rose-700">{s.error}</span>}
      </div>
    </form>
  );
}

export function NewBatchForm({ nurseryId }: { nurseryId: string }) {
  const s = useSubmit();
  return (
    <form
      className="grid gap-4 sm:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const v = formValues(form);
        if (await s.run(() => send(`/api/nurseries/${nurseryId}/batches`, "POST", v), "Batch created")) form.reset();
      }}
    >
      <Field label="Variety">
        <input name="variety" required className={inputClass} defaultValue="Khoku local" />
      </Field>
      <Field label="Rootstock">
        <input name="rootstock" required className={inputClass} defaultValue="Trifoliate orange" />
      </Field>
      <Field label="Number of saplings">
        <input name="quantity" type="number" min={1} required className={inputClass} />
      </Field>
      <Field label="Propagated / grafted on">
        <input name="propagatedOn" type="date" required className={inputClass} />
      </Field>
      <Field label="Disease test">
        <select name="testResult" className={inputClass} defaultValue="pending">
          {(Object.keys(TEST_META) as TestResult[]).map((k) => (
            <option key={k} value={k}>
              {TEST_META[k].en}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Test lab">
        <input name="testLab" className={inputClass} />
      </Field>
      <div className="flex items-center gap-3 sm:col-span-3">
        <button className={btn.primary} disabled={s.busy}>
          {s.busy ? "Creating…" : "Create batch & code"}
        </button>
        {s.done && <span className="text-sm text-emerald-700">{s.done}. Print its QR label from the table.</span>}
        {s.error && <span className="text-sm text-rose-700">{s.error}</span>}
      </div>
    </form>
  );
}

export function BatchTestSelect({ batch }: { batch: SaplingBatch }) {
  const s = useSubmit();
  return (
    <select
      aria-label={`Test result for ${batch.code}`}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
      defaultValue={batch.testResult}
      disabled={s.busy}
      onChange={(e) =>
        s.run(
          () =>
            send(`/api/batches/${batch.id}`, "PATCH", {
              testResult: e.target.value,
              testDate: new Date().toISOString().slice(0, 10),
            }),
          "Saved",
        )
      }
    >
      {(Object.keys(TEST_META) as TestResult[]).map((k) => (
        <option key={k} value={k}>
          {TEST_META[k].en}
        </option>
      ))}
    </select>
  );
}
