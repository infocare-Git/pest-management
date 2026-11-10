import type { SaplingBatch } from "@/lib/types";
import { handle, requireRole } from "@/server/auth";
import { json } from "@/server/forms";
import { nafha } from "@/server/nafha";

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole("manage_registry");
  const { id } = await ctx.params;
  const b = await json<Partial<SaplingBatch>>(req);
  return nafha.updateBatch(id, {
    ...(b.testResult && { testResult: b.testResult }),
    ...("testDate" in b && { testDate: b.testDate || undefined }),
    ...("testLab" in b && { testLab: b.testLab?.trim() || undefined }),
  });
});
