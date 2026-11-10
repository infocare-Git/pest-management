import Link from "next/link";
import { VerifySearch } from "@/components/SmallControls";
import { Card, PageHeader } from "@/components/ui";

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Check a sapling before you buy"
        titleNe="किन्नुअघि बिरुवा जाँच्नुहोस्"
        description="Scan the QR code on the sapling label with your phone camera, or type the batch code below."
      />
      <Card>
        <VerifySearch />
        <ul className="mt-5 space-y-1 text-sm text-slate-600">
          <li>✔ Shows whether the nursery is certified and the batch was disease-tested.</li>
          <li>✔ Warns you if greening has been found in orchards planted from the same batch.</li>
          <li lang="ne">✔ प्रमाणित नर्सरी र रोग परीक्षण भएको ब्याच मात्र किन्नुहोस्।</li>
        </ul>
      </Card>
      <p className="mt-4 text-sm text-slate-600">
        No label, or something looks wrong?{" "}
        <Link href="/report" className="font-medium text-rose-700 underline">
          Report it · उजुरी गर्नुहोस्
        </Link>
      </p>
    </div>
  );
}
