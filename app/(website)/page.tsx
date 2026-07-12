import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {

  return (
    <div>
      <Suspense fallback={<LoadingFallback />}>
        <HeroSection />
        <HowItWorksSection />
        {/* <HowItWorksRecruiter /> */}
        {/* <HowItWorksCompany /> */}
        {/* <SectorSection /> */}
        {/* <RecentJobsSection /> */}
        {/* <PricingSection /> */}
        {/* <CandidateRecruiterCompanyList /> */}
         
      </Suspense>
    </div>
  );
}

// ✅ Animated Loading Fallback
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 animate-pulse">Loading...</p>
    </div>
  );
}
