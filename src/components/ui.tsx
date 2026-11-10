import type { ReactNode } from "react";
import { cn, TONE_CLASSES, type Tone } from "@/lib/labels";

export function PageHeader({
  title,
  titleNe,
  description,
  actions,
}: {
  title: string;
  titleNe?: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
          {titleNe && <span className="ml-2 text-lg font-normal text-slate-500">{titleNe}</span>}
        </h1>
        {description && <div className="mt-1 text-sm text-slate-600">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  className,
  title,
  actions,
  children,
}: {
  className?: string;
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Badge({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
}) {
  const accent =
    tone === "red"
      ? "text-rose-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "green"
          ? "text-emerald-700"
          : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", accent)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Notice({ tone = "blue", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg px-4 py-3 text-sm ring-1 ring-inset", TONE_CLASSES[tone])}>
      {children}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-slate-500">{children}</p>;
}

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50",
};

export const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-5 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-5 py-2.5 align-top", className)}>{children}</td>;
}
