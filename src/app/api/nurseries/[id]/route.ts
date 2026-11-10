import type { Nursery } from "@/lib/types";
import { handle, requireRole } from "@/server/auth";
import { json } from "@/server/forms";
import { nafha } from "@/server/nafha";

const EDITABLE = [
  "name",
  "ownerName",
  "phone",
  "municipality",
  "certification",
  "certifyingBody",
  "certificationExpiry",
  "lastTestDate",
  "lastTestResult",
  "notes",
] as const;

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireRole("manage_registry");
  const { id } = await ctx.params;
  const body = await json<Partial<Nursery>>(req);
  const patch: Record<string, unknown> = {};
  for (const k of EDITABLE) if (k in body) patch[k] = body[k] || undefined;
  return nafha.updateNursery(id, patch as Partial<Nursery>);
});
