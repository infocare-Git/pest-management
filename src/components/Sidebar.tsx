"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/lib/types";
import { cn, ROLE_LABELS } from "@/lib/labels";

interface NavItem {
  href: string;
  label: string;
  ne?: string;
  roles?: Role[];
  badge?: number;
}

export default function Sidebar({
  role,
  name,
  district,
  pendingReviews,
  openFlags,
}: {
  role: Role;
  name: string;
  district: string;
  pendingReviews: number;
  openFlags: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState(name === "Unnamed user" ? "" : name);

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: "Overview",
      items: [{ href: "/", label: "Dashboard" }],
    },
    {
      title: "Module 1 · Pest & disease",
      items: [
        { href: "/identify", label: "Check a tree", ne: "बोट जाँच" },
        { href: "/cases", label: "Cases" },
        { href: "/review", label: "Expert review", roles: ["expert", "admin"], badge: pendingReviews },
        { href: "/accuracy", label: "AI accuracy" },
      ],
    },
    {
      title: "Module 2 · Planting material",
      items: [
        { href: "/verify", label: "Verify sapling", ne: "बिरुवा जाँच" },
        { href: "/report", label: "Report a problem", ne: "उजुरी" },
        { href: "/nurseries", label: "Nursery registry" },
        { href: "/flags", label: "Flags & trace-backs", roles: ["authority", "admin"], badge: openFlags },
      ],
    },
    {
      title: "NAFHA database",
      items: [
        { href: "/orchards", label: "Orchards" },
        { href: "/settings", label: "Pilot settings" },
      ],
    },
  ];

  function saveIdentity(nextRole: Role, nextName: string) {
    const maxAge = 60 * 60 * 24 * 180;
    document.cookie = `oh_role=${nextRole}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `oh_name=${encodeURIComponent(nextName.trim())}; path=/; max-age=${maxAge}; samesite=lax`;
    router.refresh();
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="border-b border-emerald-900/20 bg-emerald-950 text-emerald-50 print:hidden lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:border-b-0">
      <div className="flex items-center justify-between px-5 py-4">
        <Link href="/" className="block">
          <div className="text-base font-semibold">Orchard Health</div>
          <div className="text-xs text-emerald-300">NAFHA pilot · {district}</div>
        </Link>
        <button
          className="rounded-md px-2 py-1 text-sm ring-1 ring-emerald-700 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          Menu
        </button>
      </div>

      <div className={cn("px-3 pb-5 lg:block", open ? "block" : "hidden")}>
        <nav className="space-y-5">
          {sections.map((s) => {
            const items = s.items.filter((i) => !i.roles || i.roles.includes(role));
            if (!items.length) return null;
            return (
              <div key={s.title}>
                <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  {s.title}
                </div>
                {items.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                      isActive(i.href) ? "bg-emerald-800 text-white" : "text-emerald-100 hover:bg-emerald-900",
                    )}
                  >
                    <span>
                      {i.label}
                      {i.ne && <span className="ml-1.5 text-xs text-emerald-300">{i.ne}</span>}
                    </span>
                    {!!i.badge && (
                      <span className="rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-amber-950">
                        {i.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="mt-6 rounded-lg bg-emerald-900/60 p-3 text-sm">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Signed in as (pilot)
          </div>
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => saveIdentity(role, draftName)}
            placeholder="Your name"
            className="mb-2 w-full rounded-md border-0 bg-emerald-950 px-2 py-1.5 text-sm text-white placeholder:text-emerald-500 focus:ring-2 focus:ring-emerald-500"
          />
          <select
            value={role}
            onChange={(e) => saveIdentity(e.target.value as Role, draftName)}
            className="w-full rounded-md border-0 bg-emerald-950 px-2 py-1.5 text-sm text-white focus:ring-2 focus:ring-emerald-500"
          >
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-emerald-400">
            Role switching is for the pilot demo. Production needs real logins.
          </p>
        </div>
      </div>
    </aside>
  );
}
