import type { FlagStatus } from "@/lib/types";
import { handle, requireRole } from "@/server/auth";
import { json } from "@/server/forms";
import { UserError } from "@/server/nafha";
import { updateFlag } from "@/server/services";

export const PATCH = handle(
  async (req: Request, ctx: { params: Promise<{ kind: string; id: string }> }) => {
    await requireRole("handle_flags");
    const { kind, id } = await ctx.params;
    if (kind !== "report" && kind !== "alert") throw new UserError("Not found", 404);
    const body = await json<{ status: FlagStatus; note?: string }>(req);
    return updateFlag(kind, id, body);
  },
);
