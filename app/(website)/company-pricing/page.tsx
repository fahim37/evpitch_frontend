"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

/* ----------------------------- Types ----------------------------- */

interface Feature {
  text: string;
}

interface Plan {
  _id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
  for: string;
  valid: "monthly" | "yearly" | string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Plan[];
}

/** Local unified plan (merged monthly/yearly variants under one card) */
type LocalPlan = {
  name: string;
  titleKey: string;
  // Display labels
  monthlyPriceLabel?: string;
  annualPriceLabel?: string;
  // Numeric amounts
  monthlyAmount?: number;
  annualAmount?: number;
  // IDs
  planId: string; // representative id
  monthlyPlanId?: string;
  annualPlanId?: string;
  features: Feature[];
  buttonText: string;
};

/* --------------------------- Utilities --------------------------- */

const normalizeTitle = (t: string) =>
  (t || "").replace(/\s+/g, " ").trim().toLowerCase();

const toDisplayName = (title: string) => {
  const trimmed = (title || "").trim();
  if (!trimmed) return "Plan";
  const meaningful = trimmed.replace(/[^a-z]/gi, "");
  const hasUpper = /[A-Z]/.test(meaningful);
  if (hasUpper) return trimmed;
  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/* --------------------------- Data Fetch -------------------------- */

const fetchCompanyPlans = async (): Promise<Plan[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data: ApiResponse = await response.json();
  return data.data.filter((plan) => plan.for === "company");
};

const groupCompanyPlans = (plans: Plan[]): LocalPlan[] => {
  const map = new Map<string, { monthly?: Plan; yearly?: Plan }>();

  for (const p of plans) {
    const key = normalizeTitle(p.title);
    const bucket = map.get(key) ?? {};
    const v = (p.valid || "").toLowerCase();

    if (v === "monthly") bucket.monthly = p;
    else if (v === "yearly") bucket.yearly = p;
    else {
      // Fallback: infer from description
      if (/per\s*month/i.test(p.description)) bucket.monthly = p;
      else if (
        /per\s*ann?um/i.test(p.description) ||
        /per\s*year/i.test(p.description)
      )
        bucket.yearly = p;
      else bucket.monthly = p; // Default to monthly
    }
    map.set(key, bucket);
  }

  const out: LocalPlan[] = [];
  for (const [title, g] of map.entries()) {
    // Subscription (monthly/yearly/both)
    const base = g.monthly ?? g.yearly!;
    const monthlyAmount = g.monthly?.price;
    const annualAmount = g.yearly?.price;
    const baseTitle = g.monthly?.title ?? g.yearly?.title ?? title;
    const displayName = toDisplayName(baseTitle);
    const titleKey = normalizeTitle(displayName);

    out.push({
      name: displayName,
      titleKey,
      monthlyAmount,
      annualAmount,
      monthlyPriceLabel:
        monthlyAmount != null
          ? `$${monthlyAmount.toFixed(2)} per month`
          : undefined,
      annualPriceLabel:
        annualAmount != null
          ? `$${annualAmount.toFixed(2)} per annum`
          : undefined,
      features: (base.features ?? []).map((text) => ({ text })),
      buttonText: `Subscribe`,
      planId: base._id,
      monthlyPlanId: g.monthly?._id,
      annualPlanId: g.yearly?._id,
    });
  }

  return out;
};

/* -------------------------- Component ---------------------------- */

export default function PricingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedPlanIdForPayment, setSelectedPlanIdForPayment] =
    useState<string>("");
  const [showPlanOptions, setShowPlanOptions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LocalPlan | null>(null);

  // track user's current plan id
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  // also track current plan title + validity (monthly/yearly)
  const [currentPlanMeta, setCurrentPlanMeta] = useState<{
    titleNorm: string | null;
    valid: "monthly" | "yearly" | null;
  }>({ titleNorm: null, valid: null });

  const isSameTitle = (titleKey: string) =>
    !!currentPlanMeta.titleNorm && titleKey === currentPlanMeta.titleNorm;

  const {
    data: apiPlans,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["companyPlans"],
    queryFn: fetchCompanyPlans,
  });

  // session for auth to /user/single
  const { data: session, status } = useSession();
  const currentPlanLabel = currentPlanMeta.titleNorm
    ? toDisplayName(currentPlanMeta.titleNorm)
    : null;

  const pricingPlans = useMemo(
    () => (apiPlans ? groupCompanyPlans(apiPlans) : []),
    [apiPlans]
  );

  /* ----------------- Plan selection / payment flow ---------------- */

  const handlePlanSelect = (plan: LocalPlan) => {
    // If user already has this title and there is only one variant, do nothing
    const sameTitle = isSameTitle(plan.titleKey);
    const onlyMonthly = plan.monthlyAmount != null && plan.annualAmount == null;
    const onlyYearly = plan.annualAmount != null && plan.monthlyAmount == null;
    if (sameTitle && (onlyMonthly || onlyYearly)) return;

    // Guard: don't open modal if representative id matches
    if (currentPlanId === plan.planId) return;

    setSelectedPlan(plan);

    if (onlyMonthly) {
      setSelectedPrice(plan.monthlyAmount!.toFixed(2));
      setSelectedPlanIdForPayment(plan.monthlyPlanId || plan.planId);
      setIsModalOpen(true);
    } else if (onlyYearly) {
      setSelectedPrice(plan.annualAmount!.toFixed(2));
      setSelectedPlanIdForPayment(plan.annualPlanId || plan.planId);
      setIsModalOpen(true);
    } else {
      setShowPlanOptions(true);
    }
  };

  const handlePaymentOptionSelect = (isMonthly: boolean) => {
    if (!selectedPlan) return;
    const priceValue = isMonthly
      ? selectedPlan.monthlyAmount
      : selectedPlan.annualAmount;
    const variantId = isMonthly
      ? selectedPlan.monthlyPlanId || selectedPlan.planId
      : selectedPlan.annualPlanId || selectedPlan.planId;
    setSelectedPrice((priceValue ?? 0).toFixed(2));
    setSelectedPlanIdForPayment(variantId);
    setIsModalOpen(true);
    setShowPlanOptions(false);
  };

  /* ------------------ Fetch current user & plan ------------------- */

  useEffect(() => {
    const fetchUserData = async () => {
      const token = (session as any)?.accessToken;
      if (status !== "authenticated" || !token) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          if (response.status === 401)
            console.error("Unauthorized: invalid/expired token");
          throw new Error(`GET /user/single failed with ${response.status}`);
        }

        const result = await response.json();

        const apiPlan = result?.data?.plan;
        const titleNorm = apiPlan?.title ? normalizeTitle(apiPlan.title) : null;

        // normalize valid → monthly | yearly | null
        const vRaw = (apiPlan?.valid || "").toLowerCase().replace(/\s+/g, "");
        const valid =
          vRaw === "monthly" ? "monthly" : vRaw === "yearly" ? "yearly" : null;

        setCurrentPlanId(apiPlan?._id ?? null);
        setCurrentPlanMeta({ titleNorm, valid });
      } catch (err) {
        console.error("Error fetching user data:", err);
        setCurrentPlanId(null);
        setCurrentPlanMeta({ titleNorm: null, valid: null });
      }
    };

    fetchUserData();
  }, [session, status]);

  /* ----------------------------- UI ------------------------------ */

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Loading plans...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-500">
            Error loading plans
          </h1>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!apiPlans || apiPlans.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">No company plans available</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-7xl">
        <div className="mb-12 mt-[60px] text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            Company Price List
          </h1>
          <p className="text-md text-gray-600">
            Please view our refunds policy in our Terms and Conditions, or ask
            our Chatbot about refunds.
          </p>
        </div>

        {/* Current Plan Banner */}
        {currentPlanLabel && (
          <div className="mx-auto mb-8 w-full rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            You&apos;re currently on our <strong>{currentPlanLabel}</strong>{" "}
            {currentPlanMeta.valid && ` (${currentPlanMeta.valid})`}.
          </div>
        )}

        {/* Plan Options Modal */}
        {showPlanOptions && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-xl font-bold">
                Select Payment Option for {selectedPlan.name}
              </h3>
              <div className="space-y-3">
                {selectedPlan.monthlyPriceLabel && (
                  <Button
                    className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handlePaymentOptionSelect(true)}
                    disabled={
                      !!isSameTitle(selectedPlan.titleKey) &&
                      currentPlanMeta.valid === "monthly"
                    }
                  >
                    <div className="flex w-full items-center justify-between">
                      <span>Monthly: {selectedPlan.monthlyPriceLabel}</span>
                      {isSameTitle(selectedPlan.titleKey) &&
                        currentPlanMeta.valid === "monthly" && (
                          <span className="ml-2 rounded-full bg-white/20 px-2 py-[2px] text-xs">
                            Current
                          </span>
                        )}
                    </div>
                  </Button>
                )}

                {selectedPlan.annualPriceLabel && (
                  <Button
                    className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handlePaymentOptionSelect(false)}
                    disabled={
                      !!isSameTitle(selectedPlan.titleKey) &&
                      currentPlanMeta.valid === "yearly"
                    }
                  >
                    <div className="flex w-full items-center justify-between">
                      <span>Annual: {selectedPlan.annualPriceLabel}</span>
                      {isSameTitle(selectedPlan.titleKey) &&
                        currentPlanMeta.valid === "yearly" && (
                          <span className="ml-2 rounded-full bg-white/20 px-2 py-[2px] text-xs">
                            Current
                          </span>
                        )}
                    </div>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowPlanOptions(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid w-full grid-cols-1 gap-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => {
            const cardIsCurrentByTitle = isSameTitle(plan.titleKey);
            const isCurrent =
              currentPlanId === plan.planId || cardIsCurrentByTitle;

            return (
              <Card
                key={index}
                className={cn(
                  "flex flex-col justify-between overflow-hidden rounded-lg border-none shadow-sm"
                )}
              >
                <CardHeader className="space-y-2 p-6 pb-0">
                  <CardTitle className="text-base font-medium text-[#2B7FD0]">
                    {plan.name}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-[#2B7FD0]/20 px-2 py-1 text-xs font-normal text-[#2B7FD0]">
                        Current
                      </span>
                    )}
                  </CardTitle>

                  {/* Price row with responsive delimiter and clean spacing */}
                  <div className="mt-2">
                    <div className="flex flex-wrap items-center gap-2 text-[18px]">
                      {plan.monthlyPriceLabel && (
                        <p className="font-bold text-[#282828]">
                          {plan.monthlyPriceLabel}
                        </p>
                      )}

                      {/* Delimiter only if both prices exist */}
                      {plan.monthlyPriceLabel && plan.annualPriceLabel && (
                        <span
                          className="text-gray-400"
                          aria-label="choose monthly or annual billing"
                        >
                          <span className="hidden sm:inline">/</span>
                          <span className="inline sm:hidden">or</span>
                        </span>
                      )}

                      {plan.annualPriceLabel && (
                        <p className="font-bold text-[#282828]">
                          {plan.annualPriceLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow space-y-4 p-6 pt-4">
                  <h3 className="text-base font-medium text-[#8593A3]">
                    What you will get
                  </h3>
                  <ul className="space-y-2 text-[#343434]">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#2B7FD0]">
                          <Check className="h-5 w-5 flex-shrink-0 text-white" />
                        </div>
                        <span className="text-base font-medium text-[#343434]">
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button
                    className="h-[58px] w-full rounded-[80px] text-lg font-semibold border-2 border-[#2B7FD0] bg-transparent text-[#2B7FD0] hover:bg-[#2B7FD0] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    variant="outline"
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "Current Plan" : plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Payment Method Modal */}
        <PaymentMethodModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          price={selectedPrice || "0.00"}
          planId={selectedPlanIdForPayment}
        />
      </div>
    </div>
  );
}
