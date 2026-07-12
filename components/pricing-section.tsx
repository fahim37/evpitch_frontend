"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal";
import { useSession } from "next-auth/react";

interface SubscriptionPlan {
  _id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
  for: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const fetchPlans = async (token?: string): Promise<SubscriptionPlan[]> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`,
    {
      headers,
    }
  );

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();
  return data.data.filter((plan: SubscriptionPlan) => plan.for === "candidate");
};

// Skeleton loader component for a single pricing card
const PricingCardSkeleton = () => (
  <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 w-[362px]">
    <div className="pb-4">
      <div className="skeleton skeleton-title w-[100px] h-4 mb-6"></div>
      <div className="skeleton skeleton-price w-[150px] h-16 mb-4"></div>
      <div className="skeleton skeleton-description w-full h-12 mt-6"></div>
    </div>
    <div className="pt-4">
      <ul className="space-y-3">
        <li className="flex items-center gap-2">
          <div className="skeleton w-5 h-5 rounded-full"></div>
          <div className="skeleton skeleton-text w-3/4 h-4"></div>
        </li>
        <li className="flex items-center gap-2">
          <div className="skeleton w-5 h-5 rounded-full"></div>
          <div className="skeleton skeleton-text w-3/4 h-4"></div>
        </li>
      </ul>
      <div className="skeleton skeleton-button w-full h-10 mt-8 rounded-[80px]"></div>
    </div>
  </div>
);

// Static basic plan data
const staticBasicPlan = {
  _id: "basic-plan",
  title: "Basic",
  description: "This plan is for entry-level candidates.",
  price: 0,
  features: [
    "Apply to 5 jobs per month",
    "Basic support",
    "Limited access to job listings"
  ],
  for: "candidate"
};

export default function PricingSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const session = useSession();
  const token = session.data?.accessToken;

  const {
    data: candidatePlans,
    isLoading,
    error,
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ["subscriptionPlans", token],
    queryFn: () => fetchPlans(token),
    enabled: !!token, 
  });

  const handleOpenModal = (price: number, planId: string) => {
    if (!token) {
      // Handle unauthenticated user case (redirect to login or show message)
      return;
    }
    setSelectedPrice(price);
    setSelectedPlanId(planId);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="relative container lg:px-4 pb-24 pt-4">
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 opacity-30">
          <Image
            src="/assets/vector.png"
            alt="Background wave pattern"
            width={1000}
            height={1000}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <div className="py-8 text-center space-y-3">
            <div className="skeleton w-[300px] h-10 mx-auto"></div>
            <div className="skeleton w-16 h-[3px] mx-auto mt-2"></div>
            <div className="skeleton w-[400px] h-12 mx-auto mt-3"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 w-[756px] mx-auto">
            <PricingCardSkeleton />
            <PricingCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-500">
            Error loading plans
          </h1>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  // Get the first candidate plan from API as premium (if exists)
  const premiumPlan = candidatePlans && candidatePlans.length > 0 
    ? candidatePlans[0] 
    : null;

  return (
    <div className="relative container lg:px-4 pb-24 pt-4">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-30">
        <Image
          src="/assets/vector.png"
          alt="Background wave pattern"
          width={1000}
          height={1000}
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <div className="py-8 text-center space-y-3">
          <h1 className="text-[20px] lg:text-[40px] font-bold relative inline-block">
            Pricing & Plan (Jobseekers Page)
            <span className="block w-16 h-[3px] bg-[#2563eb] mx-auto mt-2"></span>
          </h1>
          <p className="text-[#707070] md:max-w-xl mx-auto">
            Lorem ipsum dolor sit amet consectetur. Quisque blandit vitae lectus
            viverra dictumst id eget mi. Malesuada sit urna cursus ve
          </p>
        </div>

        <div className="relative z-10 grid gap-6 md:grid-cols-2 w-[756px] mx-auto">
          {/* Static Basic Plan Card */}
          <Card className="rounded-xl shadow-lg p-6 border border-gray-200 w-[362px]">
            <CardHeader className="pb-4">
              <p className="text-base font-semibold text-[#44B6CA] uppercase tracking-wider mb-[24px]">
                {staticBasicPlan.title}
              </p>
              <h2 className="text-base font-normal text-[#8593A3] text-nowrap">
                <span className="text-[#282828] text-[64px] font-bold">
                  Free
                </span>{" "}
                What you will get:
              </h2>
              <p className="text-[#8593A3] !mt-[24px] text-base leading-relaxed">
                {staticBasicPlan.description}
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {staticBasicPlan.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-[#8593A3]"
                  >
                    <div className="w-[21px] h-[21px] bg-[#44B6CA] rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full mt-8 rounded-[80px] border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                onClick={() => handleOpenModal(staticBasicPlan.price, staticBasicPlan._id)}
              >
                Join with basic
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan Card (from API) */}
          {premiumPlan ? (
            <Card className="rounded-xl shadow-lg bg-[#2B7FD0] text-white w-[362px]">
              <CardHeader className="mt-4">
                <p className="text-sm font-semibold uppercase tracking-wider">
                  {premiumPlan.title}
                </p>
                <div className="mt-2">
                  <h2 className="text-5xl font-bold inline-flex items-baseline">
                    ${premiumPlan.price}
                    <span className="text-base font-normal ml-1">Per Month</span>
                  </h2>
                </div>
                <div className="mt-2 border-b border-white pb-4">
                  <h2 className="text-5xl font-bold inline-flex items-baseline">
                    ${premiumPlan.price * 10}{" "}
                    {/* Assuming yearly is 10x monthly */}
                    <span className="text-base font-normal ml-1">Per Year</span>
                  </h2>
                </div>
                <p className="text-sm text-right mt-4">What you will get:</p>
              </CardHeader>
              <CardContent className="mt-1">
                <ul className="space-y-3">
                  {premiumPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-white" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-8 !rounded-[80px] bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() =>
                    handleOpenModal(premiumPlan.price, premiumPlan._id)
                  }
                >
                  Get the premium
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl shadow-lg p-6 border border-gray-200 w-[362px]">
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Premium plan not available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        price={selectedPrice !== null ? selectedPrice.toString() : ""}
        planId={selectedPlanId || ""}
      />
    </div>
  );
}