import type { SaplingBatch } from "@/lib/types";
import { handle, requireRole } from "@/server/auth";
import { json } from "@/server/forms";
import { nafha, UserError } from "@/server/nafha";
import { nextBatchCode } from "@/server/services";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole("manage_registry");
  const { id } = await ctx.params;
  const nursery = await nafha.getNursery(id);
  if (!nursery) throw new UserError("Nursery not found", 404);
  const b = await json<Partial<SaplingBatch>>(req);
  const quantity = Number(b.quantity);
  if (!b.variety?.trim() || !b.rootstock?.trim() || !b.propagatedOn || !(quantity > 0))
    throw new UserError("Variety, rootstock, propagation date and quantity are required");
  return nafha.createBatch({
    code: await nextBatchCode(nursery),
    nurseryId: nursery.id,
    crop: "mandarin",
    variety: b.variety.trim(),
    rootstock: b.rootstock.trim(),
    quantity,
    propagatedOn: b.propagatedOn,
    testResult: b.testResult ?? "not_tested",
    testDate: b.testDate || undefined,
    testLab: b.testLab?.trim() || undefined,
  });
});
