import type { Settings } from "@/lib/types";
import { handle, requireRole } from "@/server/auth";
import { json } from "@/server/forms";
import { updateSettings } from "@/server/services";

export const PATCH = handle(async (req: Request) => {
  await requireRole("admin");
  return updateSettings(await json<Partial<Settings>>(req));
});
