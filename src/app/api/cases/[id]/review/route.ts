import type { ConditionId } from "@/lib/types";
import { handle, requireRole } from "@/server/auth";
import { json } from "@/server/forms";
import { reviewCase } from "@/server/services";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireRole("review");
  const { id } = await ctx.params;
  const body = await json<{ condition: ConditionId; note?: string }>(req);
  return reviewCase(id, { expertName: actor.name, condition: body.condition, note: body.note });
});
