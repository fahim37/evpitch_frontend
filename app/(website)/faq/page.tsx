import { Metadata } from "next";
import { FaqSection } from "@/components/FaqSection";
import PageHeaders from "@/components/shared/PageHeaders";

export const metadata: Metadata = {
  title: "FAQ | Elevator Pitch",
  description:
    "Find answers to frequently asked questions about Elevator Pitch.",
};

export default function FaqPage() {
  return (
    <div className="bg-gray-50 flex flex-col items-center py-12">
      <main className="flex-1 w-full">
        <PageHeaders title="Frequently Asked Questions" description="" />
        <FaqSection />
      </main>
    </div>
  );
}
