import type { Nursery, Orchard, SaplingBatch } from "@/lib/types";
import { mutate, newId, nowISO, readDb } from "./db";

/**
 * Integration boundary with the existing NAFHA orchard database.
 *
 * The app never stores its own copy of orchards, nurseries or batches. Everything goes
 * through this interface, so the pilot can run on the mock below and switch to the
 * real NAFHA database (direct SQL, REST API or sync job) by adding one implementation.
 * The nursery registry and sapling batches are new tables/collections *inside* the
 * NAFHA database, keyed to its existing records.
 */
export interface NafhaOrchardDb {
  listOrchards(): Promise<Orchard[]>;
  getOrchard(id: string): Promise<Orchard | null>;

  listNurseries(): Promise<Nursery[]>;
  getNursery(id: string): Promise<Nursery | null>;
  createNursery(input: Omit<Nursery, "id" | "updatedAt">): Promise<Nursery>;
  updateNursery(id: string, patch: Partial<Omit<Nursery, "id">>): Promise<Nursery>;

  listBatches(filter?: { nurseryId?: string }): Promise<SaplingBatch[]>;
  getBatchByCode(code: string): Promise<SaplingBatch | null>;
  createBatch(input: Omit<SaplingBatch, "id" | "createdAt">): Promise<SaplingBatch>;
  updateBatch(id: string, patch: Partial<Omit<SaplingBatch, "id" | "code">>): Promise<SaplingBatch>;
}

/** Mock adapter backed by the pilot JSON store (`db.nafha`). */
class MockNafhaDb implements NafhaOrchardDb {
  async listOrchards() {
    return (await readDb()).nafha.orchards;
  }
  async getOrchard(id: string) {
    return (await readDb()).nafha.orchards.find((o) => o.id === id) ?? null;
  }
  async listNurseries() {
    return (await readDb()).nafha.nurseries;
  }
  async getNursery(id: string) {
    return (await readDb()).nafha.nurseries.find((n) => n.id === id) ?? null;
  }
  async createNursery(input: Omit<Nursery, "id" | "updatedAt">) {
    return mutate((db) => {
      if (db.nafha.nurseries.some((n) => n.code === input.code)) {
        throw new UserError(`Nursery code ${input.code} is already in use`);
      }
      const n: Nursery = { ...input, id: newId("NUR"), updatedAt: nowISO() };
      db.nafha.nurseries.push(n);
      return n;
    });
  }
  async updateNursery(id: string, patch: Partial<Omit<Nursery, "id">>) {
    return mutate((db) => {
      const n = db.nafha.nurseries.find((x) => x.id === id);
      if (!n) throw new UserError("Nursery not found", 404);
      Object.assign(n, patch, { updatedAt: nowISO() });
      return n;
    });
  }
  async listBatches(filter?: { nurseryId?: string }) {
    const all = (await readDb()).nafha.batches;
    return filter?.nurseryId ? all.filter((b) => b.nurseryId === filter.nurseryId) : all;
  }
  async getBatchByCode(code: string) {
    const c = normalizeCode(code);
    return (await readDb()).nafha.batches.find((b) => b.code === c) ?? null;
  }
  async createBatch(input: Omit<SaplingBatch, "id" | "createdAt">) {
    return mutate((db) => {
      if (db.nafha.batches.some((b) => b.code === input.code)) {
        throw new UserError(`Batch code ${input.code} already exists`);
      }
      const b: SaplingBatch = { ...input, id: newId("BAT"), createdAt: nowISO() };
      db.nafha.batches.push(b);
      return b;
    });
  }
  async updateBatch(id: string, patch: Partial<Omit<SaplingBatch, "id" | "code">>) {
    return mutate((db) => {
      const b = db.nafha.batches.find((x) => x.id === id);
      if (!b) throw new UserError("Batch not found", 404);
      Object.assign(b, patch);
      return b;
    });
  }
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Error whose message is safe to show to the user. */
export class UserError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/**
 * Pick the adapter. Add the real NAFHA implementation here, e.g.
 *   if (process.env.NAFHA_ADAPTER === "postgres") return new PostgresNafhaDb(process.env.NAFHA_DB_URL!);
 */
function createAdapter(): NafhaOrchardDb {
  return new MockNafhaDb();
}

export const nafha: NafhaOrchardDb = createAdapter();
