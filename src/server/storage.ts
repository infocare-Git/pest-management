import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import type { Db } from "@/lib/types";

/**
 * Where pilot data lives.
 *  - "redis": Upstash Redis (Vercel Marketplace → Upstash). Durable and shared by all
 *    serverless instances. Used whenever its env vars are present.
 *  - "file":  local disk (data/). For running on your own server or laptop.
 *  - "tmp":   /tmp on Vercel when no Redis is connected. Works, but data is lost on
 *    redeploys and cold starts. Demo only.
 */
export interface Store {
  kind: "redis" | "file" | "tmp";
  getDb(): Promise<Db | null>;
  setDb(db: Db): Promise<void>;
  /** Run fn while holding a write lock, so concurrent writes don't overwrite each other. */
  withLock<T>(fn: () => Promise<T>): Promise<T>;
  putFile(name: string, data: Buffer): Promise<void>;
  getFile(name: string): Promise<Buffer | null>;
}

/* ---------- Local / tmp filesystem ---------- */

class FileStore implements Store {
  private dbFile: string;
  private uploads: string;
  constructor(
    public kind: "file" | "tmp",
    private dir: string,
  ) {
    this.dbFile = path.join(dir, "db.json");
    this.uploads = path.join(dir, "uploads");
  }
  async getDb() {
    try {
      return JSON.parse(await fs.readFile(this.dbFile, "utf8")) as Db;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }
  async setDb(db: Db) {
    await fs.mkdir(this.dir, { recursive: true });
    const tmp = `${this.dbFile}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    // Windows refuses to replace a file another request is reading (EPERM/EBUSY): retry briefly.
    for (let attempt = 0; ; attempt++) {
      try {
        await fs.rename(tmp, this.dbFile);
        return;
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if ((code !== "EPERM" && code !== "EBUSY" && code !== "EACCES") || attempt >= 20) throw err;
        await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
      }
    }
  }
  withLock<T>(fn: () => Promise<T>): Promise<T> {
    // Shared across route bundles in the same process.
    const g = globalThis as unknown as { __ohQueue?: Promise<unknown> };
    const run = (g.__ohQueue ?? Promise.resolve()).then(fn);
    g.__ohQueue = run.catch(() => undefined);
    return run;
  }
  async putFile(name: string, data: Buffer) {
    await fs.mkdir(this.uploads, { recursive: true });
    await fs.writeFile(path.join(this.uploads, name), data);
  }
  async getFile(name: string) {
    try {
      return await fs.readFile(path.join(this.uploads, name));
    } catch {
      return null;
    }
  }
}

/* ---------- Upstash Redis ---------- */

const DB_KEY = "oh:db";
const LOCK_KEY = "oh:lock";
const FILE_PREFIX = "oh:file:";

class RedisStore implements Store {
  kind = "redis" as const;
  constructor(private redis: Redis) {}

  async getDb() {
    const raw = await this.redis.get<string>(DB_KEY);
    return raw ? (JSON.parse(raw) as Db) : null;
  }
  async setDb(db: Db) {
    await this.redis.set(DB_KEY, JSON.stringify(db));
  }
  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const token = crypto.randomUUID();
    const deadline = Date.now() + 15_000;
    for (let wait = 50; ; wait = Math.min(wait * 2, 500)) {
      if (await this.redis.set(LOCK_KEY, token, { nx: true, px: 20_000 })) break;
      if (Date.now() > deadline) throw new Error("Database is busy, please try again");
      await new Promise((r) => setTimeout(r, wait));
    }
    try {
      return await fn();
    } finally {
      // Release only if we still own the lock.
      await this.redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        [LOCK_KEY],
        [token],
      );
    }
  }
  async putFile(name: string, data: Buffer) {
    await this.redis.set(FILE_PREFIX + name, data.toString("base64"));
  }
  async getFile(name: string) {
    const b64 = await this.redis.get<string>(FILE_PREFIX + name);
    return b64 ? Buffer.from(b64, "base64") : null;
  }
}

function createStore(): Store {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) {
    return new RedisStore(new Redis({ url, token, automaticDeserialization: false }));
  }
  if (process.env.DATA_DIR) return new FileStore("file", process.env.DATA_DIR);
  if (process.env.VERCEL) return new FileStore("tmp", "/tmp/orchard-health");
  return new FileStore("file", path.join(process.cwd(), "data"));
}

const g = globalThis as unknown as { __ohStore?: Store };
export const store: Store = (g.__ohStore ??= createStore());
