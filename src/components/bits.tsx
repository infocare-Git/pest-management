import Link from "next/link";
import type { Case, CertificationStatus, ConditionId, FlagStatus, TestResult } from "@/lib/types";
import { CONDITIONS } from "@/lib/catalog";
import { CASE_STATUS_META, CERT_META, FLAG_META, formatDate, pct, TEST_META, type Tone } from "@/lib/labels";
import { Badge, Td } from "./ui";

const SEVERITY_TONE: Record<string, Tone> = { critical: "red", high: "amber", medium: "amber", none: "green" };

export function ConditionBadge({ id }: { id: ConditionId }) {
  const c = CONDITIONS[id];
  return <Badge tone={id === "unclear" ? "slate" : SEVERITY_TONE[c.severity]}>{c.nameEn}</Badge>;
}

export function CertBadge({ status, ne }: { status: CertificationStatus; ne?: boolean }) {
  const m = CERT_META[status];
  return <Badge tone={m.tone}>{ne ? `${m.ne} · ${m.en}` : m.en}</Badge>;
}

export function TestBadge({ result, ne }: { result: TestResult; ne?: boolean }) {
  const m = TEST_META[result];
  return <Badge tone={m.tone}>{ne ? `${m.ne} · ${m.en}` : m.en}</Badge>;
}

export function FlagBadge({ status }: { status: FlagStatus }) {
  return <Badge tone={FLAG_META[status].tone}>{FLAG_META[status].en}</Badge>;
}

export function CaseStatusBadge({ c }: { c: Case }) {
  const m = CASE_STATUS_META[c.status];
  return <Badge tone={m.tone}>{m.en}</Badge>;
}

export function CaseRow({ c }: { c: Case }) {
  return (
    <tr className="hover:bg-slate-50">
      <Td>
        <Link href={`/cases/${c.id}`} className="font-medium text-emerald-800 hover:underline">
          {c.id}
        </Link>
        <div className="text-xs text-slate-500">{formatDate(c.createdAt)}</div>
      </Td>
      <Td>
        {c.farmerName}
        <div className="text-xs text-slate-500">{c.orchardId ?? "No orchard link"}</div>
      </Td>
      <Td>
        <ConditionBadge id={c.ai.top} />
        <div className="text-xs text-slate-500">{pct(c.ai.confidence)} confidence</div>
      </Td>
      <Td>
        {c.review ? (
          <>
            <ConditionBadge id={c.review.condition} />
            <div className={`text-xs ${c.review.agreed ? "text-emerald-700" : "text-rose-700"}`}>
              {c.review.agreed ? "Agreed with AI" : "Corrected"}
            </div>
          </>
        ) : c.reviewRequired ? (
          <span className="text-xs text-slate-500">Not yet</span>
        ) : (
          <span className="text-xs text-slate-500">Not required</span>
        )}
      </Td>
      <Td>
        <CaseStatusBadge c={c} />
      </Td>
    </tr>
  );
}

export function Photo({ name, alt }: { name: string; alt: string }) {
  return (
    <a href={`/api/uploads/${name}`} target="_blank" rel="noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/uploads/${name}`}
        alt={alt}
        className="aspect-square w-full rounded-lg bg-slate-100 object-cover ring-1 ring-slate-200"
      />
    </a>
  );
}
