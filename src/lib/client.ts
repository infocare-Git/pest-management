/** Browser-side helper for calling the API. Throws an Error with a readable message. */
export async function send<T = unknown>(
  url: string,
  method: "POST" | "PATCH",
  body?: unknown,
): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(url, {
    method,
    headers: isForm || body === undefined ? undefined : { "Content-Type": "application/json" },
    body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

/** Downscale a photo to max `size` px on the long edge and re-encode as JPEG. */
export async function compressImage(file: File, size = 1280, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read photo"))), "image/jpeg", quality),
  );
}
