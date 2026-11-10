"use client";

import { useState } from "react";
import { compressImage } from "@/lib/client";

export interface PickedPhoto {
  blob: Blob;
  url: string;
}

export default function PhotoInput({
  photos,
  onChange,
  max = 4,
}: {
  photos: PickedPhoto[];
  onChange: (p: PickedPhoto[]) => void;
  max?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const room = max - photos.length;
      const picked = await Promise.all(
        [...files].slice(0, room).map(async (f) => {
          const blob = await compressImage(f);
          return { blob, url: URL.createObjectURL(blob) };
        }),
      );
      onChange([...photos, ...picked]);
      if (files.length > room) setError(`Only ${max} photos allowed.`);
    } catch {
      setError("Could not read that photo. Try another one.");
    } finally {
      setBusy(false);
    }
  }

  function remove(i: number) {
    URL.revokeObjectURL(photos[i].url);
    onChange(photos.filter((_, j) => j !== i));
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((p, i) => (
          <div key={p.url} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
            >
              Remove
            </button>
          </div>
        ))}
        {photos.length < max && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 text-center text-sm text-emerald-800 hover:bg-emerald-100">
            <span className="text-2xl">＋</span>
            <span>{busy ? "Processing…" : "Take / add photo"}</span>
            <span className="text-xs text-emerald-600">फोटो खिच्नुहोस्</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                add(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
