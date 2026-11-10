import { handle } from "@/server/auth";
import { verifyBatch } from "@/server/services";

/** Public JSON lookup, e.g. for an SMS/IVR gateway: GET /api/verify/SYA-N01-2507-01 */
export const GET = handle(async (_req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const { code } = await ctx.params;
  const v = await verifyBatch(decodeURIComponent(code));
  return {
    code: v.code,
    verdict: v.verdict,
    reasons: v.reasons,
    nursery: v.nursery && {
      name: v.nursery.name,
      registrationNo: v.nursery.registrationNo,
      certification: v.nursery.certification,
      certificationExpiry: v.nursery.certificationExpiry,
    },
    batch: v.batch && {
      variety: v.batch.variety,
      rootstock: v.batch.rootstock,
      propagatedOn: v.batch.propagatedOn,
      testResult: v.batch.testResult,
      testDate: v.batch.testDate,
    },
  };
});
