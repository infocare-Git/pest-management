import { randomUUID } from "crypto";
import type { Db } from "@/lib/types";
import { createSeed } from "./seed";
import { store } from "./storage";

export { store };

async function load(): Promise<Db> {
  const db = await store.getDb();
  if (db) return db;
  // First run: create the sample data (under the lock so two instances don't both seed).
  return store.withLock(async () => {
    const again = await store.getDb();
    if (again) return again;
    const seed = createSeed();
    await store.setDb(seed);
    return seed;
  });
}

export async function readDb(): Promise<Db> {
  return load();
}

/** Run `fn` against the database and save the result. Writes are serialized. */
export async function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  await load();
  return store.withLock(async () => {
    const db = (await store.getDb())!;
    const result = await fn(db);
    await store.setDb(db);
    return result;
  });
}

export async function resetDb(): Promise<void> {
  await store.withLock(() => store.setDb(createSeed()));
}

/** Save an uploaded photo and return its stored file name. */
export async function saveUpload(data: ArrayBuffer): Promise<string> {
  const name = `${randomUUID()}.jpg`;
  await store.putFile(name, Buffer.from(data));
  return name;
}

export const UPLOAD_NAME = /^[0-9a-f-]{36}\.jpg$/;

export function newId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
