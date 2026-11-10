"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Case, Orchard } from "@/lib/types";
import { send } from "@/lib/client";
import PhotoInput, { type PickedPhoto } from "./PhotoInput";
import { btn, Field, inputClass, Notice } from "./ui";

export default function IdentifyForm({ orchards }: { orchards: Orchard[] }) {
  const router = useRouter();
  const [orchardId, setOrchardId] = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? orchards.filter((o) =>
          `${o.id} ${o.ownerName} ${o.municipality}`.toLowerCase().includes(q),
        )
      : orchards;
  }, [orchards, query]);

  function chooseOrchard(id: string) {
    setOrchardId(id);
    const o = orchards.find((x) => x.id === id);
    if (o) {
      setFarmerName(o.ownerName);
      setFarmerPhone(o.ownerPhone ?? "");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!photos.length) return setError("Add at least one photo.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("orchardId", orchardId);
      fd.set("farmerName", farmerName);
      fd.set("farmerPhone", farmerPhone);
      fd.set("notes", notes);
      photos.forEach((p, i) => fd.append("photos", p.blob, `photo-${i + 1}.jpg`));
      const c = await send<Case>("/api/cases", "POST", fd);
      router.push(`/cases/${c.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section>
        <h2 className="mb-1 text-sm font-semibold text-slate-900">1. Photos · फोटो</h2>
        <p className="mb-3 text-xs text-slate-500">
          Up to 4 clear photos in daylight: a close-up of the affected leaf, fruit or bark, both sides of
          the leaf, and one of the whole tree.
        </p>
        <PhotoInput photos={photos} onChange={setPhotos} />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">2. Orchard · बगैंचा</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Search NAFHA orchard records">
            <input
              className={inputClass}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Owner name, orchard ID or municipality"
            />
          </Field>
          <Field
            label="Orchard"
            hint="Linking the orchard lets greening be traced to the nursery that supplied it."
          >
            <select className={inputClass} value={orchardId} onChange={(e) => chooseOrchard(e.target.value)}>
              <option value="">Not in NAFHA database / unknown</option>
              {filtered.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.ownerName} · {o.municipality}-{o.ward} · {o.id}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Farmer name · किसानको नाम">
            <input className={inputClass} value={farmerName} onChange={(e) => setFarmerName(e.target.value)} required />
          </Field>
          <Field label="Farmer phone (optional)">
            <input
              className={inputClass}
              value={farmerPhone}
              onChange={(e) => setFarmerPhone(e.target.value)}
              inputMode="tel"
            />
          </Field>
          <Field label="Crop">
            <select className={inputClass} defaultValue="mandarin">
              <option value="mandarin">Mandarin (सुन्तला)</option>
              <option disabled>Second crop: to be confirmed</option>
            </select>
          </Field>
          <Field label="What did you notice? (optional)" className="sm:col-span-2">
            <textarea
              className={inputClass}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. how many trees, since when, which part of the tree"
            />
          </Field>
        </div>
      </section>

      {error && <Notice tone="red">{error}</Notice>}

      <button type="submit" className={btn.primary} disabled={busy}>
        {busy ? "Analysing photos…" : "Identify · पहिचान गर्नुहोस्"}
      </button>
    </form>
  );
}
