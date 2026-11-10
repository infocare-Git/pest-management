import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getActor } from "@/server/auth";
import { readDb, store } from "@/server/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orchard Health · NAFHA pilot",
  description: "Citrus pest & disease identification and planting-material quality assurance.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#022c22" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [actor, db] = await Promise.all([getActor(), readDb()]);
  const pendingReviews = db.cases.filter((c) => c.status === "pending_review").length;
  const openFlags =
    db.reports.filter((r) => r.status === "open").length + db.alerts.filter((a) => a.status === "open").length;

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar
            role={actor.role}
            name={actor.name}
            district={db.settings.pilotDistrict}
            pendingReviews={pendingReviews}
            openFlags={openFlags}
          />
          <main className="min-w-0 flex-1">
            {store.kind === "tmp" && (
              <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900 print:hidden">
                Demo storage: data entered here is temporary and will be lost on redeploy. Connect Upstash
                Redis in Vercel to keep it.
              </div>
            )}
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
