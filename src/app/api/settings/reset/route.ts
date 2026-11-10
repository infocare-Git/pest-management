import { handle, requireRole } from "@/server/auth";
import { resetDb } from "@/server/db";

export const POST = handle(async () => {
  await requireRole("admin");
  await resetDb();
});
