import { UserError } from "./nafha";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export async function photos(fd: FormData): Promise<ArrayBuffer[]> {
  const files = fd.getAll("photos").filter((f): f is File => typeof f !== "string" && f.size > 0);
  for (const f of files) {
    if (f.size > MAX_PHOTO_BYTES) throw new UserError("Each photo must be under 5 MB");
    if (f.type && f.type !== "image/jpeg") throw new UserError("Photos must be JPEG");
  }
  return Promise.all(files.map((f) => f.arrayBuffer()));
}

export async function json<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new UserError("Invalid request body");
  }
}
