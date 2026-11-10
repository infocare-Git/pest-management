import { getActor, handle } from "@/server/auth";
import { photos, str } from "@/server/forms";
import { createCase } from "@/server/services";

export const POST = handle(async (req: Request) => {
  const actor = await getActor();
  const fd = await req.formData();
  return createCase({
    submittedBy: actor.name,
    farmerName: str(fd, "farmerName"),
    farmerPhone: str(fd, "farmerPhone"),
    orchardId: str(fd, "orchardId"),
    notes: str(fd, "notes"),
    photos: await photos(fd),
  });
});
