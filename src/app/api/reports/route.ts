import type { ReportIssue } from "@/lib/types";
import { ISSUE_META } from "@/lib/labels";
import { handle } from "@/server/auth";
import { photos, str } from "@/server/forms";
import { UserError } from "@/server/nafha";
import { createReport } from "@/server/services";

export const POST = handle(async (req: Request) => {
  const fd = await req.formData();
  const issue = str(fd, "issue") as ReportIssue;
  if (!(issue in ISSUE_META)) throw new UserError("Choose what the problem is");
  return createReport({
    reporterName: str(fd, "reporterName"),
    reporterPhone: str(fd, "reporterPhone"),
    batchCode: str(fd, "batchCode"),
    nurseryId: str(fd, "nurseryId"),
    sellerText: str(fd, "sellerText"),
    issue,
    description: str(fd, "description"),
    photos: await photos(fd),
  });
});
