import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Db } from "@/lib/types";
import { createSeed } from "./seed";

/**
 * Pilot data store: a single JSON file plus an uploads folder.
 * Good enough for one district and a few dozen users. Swap for Postgres (or tables
 * in the NAFHA database) before scaling beyond the pilot.
 */
export const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Shared across route bundles in the same process so writes are serialized.
const g = globalThis as unknown as { __ohQueue?: Promise<unknown> };
g.__ohQueue ??= Promise.resolve();

async function load(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Db;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const seed = createSeed();
    await persist(seed);
    return seed;
  }
}

async function persist(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

export async function readDb(): Promise<Db> {
  await g.__ohQueue;
  return load();
}

/** Run `fn` against the database and save the result. Calls are serialized. */
export function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = (g.__ohQueue as Promise<unknown>).then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  g.__ohQueue = run.catch(() => undefined);
  return run;
}

export async function resetDb(): Promise<void> {
  await mutate((db) => {
    Object.assign(db, createSeed());
  });
}

/** Save an uploaded photo and return its stored file name. */
export async function saveUpload(data: ArrayBuffer): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.jpg`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(data));
  return name;
}

export const UPLOAD_NAME = /^[0-9a-f-]{36}\.jpg$/;

export function newId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
