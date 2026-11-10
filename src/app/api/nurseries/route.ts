import type { Nursery } from "@/lib/types";
import { handle, requireRole } from "@/server/auth";
import { json } from "@/server/forms";
import { nafha, normalizeCode, UserError } from "@/server/nafha";

export const POST = handle(async (req: Request) => {
  await requireRole("manage_registry");
  const b = await json<Partial<Nursery>>(req);
  if (!b.name?.trim() || !b.code?.trim() || !b.registrationNo?.trim() || !b.ownerName?.trim())
    throw new UserError("Name, code, registration number and owner are required");
  return nafha.createNursery({
    code: normalizeCode(b.code),
    name: b.name.trim(),
    registrationNo: b.registrationNo.trim(),
    ownerName: b.ownerName.trim(),
    phone: b.phone?.trim() || undefined,
    district: b.district?.trim() || "",
    municipality: b.municipality?.trim() || "",
    certification: b.certification ?? "not_certified",
    certifyingBody: b.certifyingBody?.trim() || undefined,
    certificationExpiry: b.certificationExpiry || undefined,
    lastTestDate: b.lastTestDate || undefined,
    lastTestResult: b.lastTestResult ?? "not_tested",
    notes: b.notes?.trim() || undefined,
  });
});
