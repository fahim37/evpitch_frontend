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
  valid: "monthly" | "yearly" | "PayAsYouGo" | string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  titleColor?: string; // 👈 comes from backend
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
  description?: string; // PAYG label
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
  isPayAsYouGo?: boolean;
  titleColor?: string; // 👈 used in UI
};

/* --------------------------- Utilities --------------------------- */

const normalizeTitle = (t: string) =>
  (t || "").replace(/\s+/g, " ").trim().toLowerCase();
const toValid = (v?: string | null) =>
  (v || "").trim().toLowerCase() as
    | "monthly"
    | "yearly"
    | "payasyougo"
    | string;

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

const fetchRecruiterPlans = async (): Promise<Plan[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data: ApiResponse = await response.json();
  return data.data.filter((plan) => plan.for === "recruiter");
};

const groupRecruiterPlans = (plans: Plan[]): LocalPlan[] => {
  const map = new Map<string, { monthly?: Plan; yearly?: Plan; payg?: Plan }>();

  for (const p of plans) {
    const key = normalizeTitle(p.title);
    const bucket = map.get(key) ?? {};
    const v = (p.valid || "").toLowerCase();

    if (v === "monthly") bucket.monthly = p;
    else if (v === "yearly") bucket.yearly = p;
    else if (v === "payasyougo") bucket.payg = p;
    else {
      // Fallback: infer from description
      if (/per\s*month/i.test(p.description)) bucket.monthly = p;
      else if (/per\s*ann?um|per\s*year/i.test(p.description))
        bucket.yearly = p;
      else bucket.payg = p;
    }
    map.set(key, bucket);
  }

  const out: LocalPlan[] = [];
  for (const [title, g] of map.entries()) {
    // Pay As You Go branch
    if (g.payg) {
      const paygName = toDisplayName(g.payg.title ?? title);
      const paygKey = normalizeTitle(paygName);
      out.push({
        name: paygName,
        titleKey: paygKey,
        description: `$${g.payg.price.toFixed(
          2
        )} per Job Advert (30 Days Post)`,
        features: (g.payg.features ?? []).map((text) => ({ text })),
        buttonText: "Purchase",
        planId: g.payg._id,
        isPayAsYouGo: true,
        titleColor: g.payg.titleColor, // 👈 store color
      });
      continue;
    }

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
      titleColor: base.titleColor, // 👈 store color
    });
  }

  return out;
};

/* -------------------------- Component ---------------------------- */

export default function PricingPlans() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedPlanIdForPayment, setSelectedPlanIdForPayment] =
    useState<string>("");
  const [showPlanOptions, setShowPlanOptions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LocalPlan | null>(null);

  // Banner plan (just for display)
  const [planBanner, setPlanBanner] = useState<{
    title?: string;
    valid?: string;
  } | null>({
    title: "Free Plan",
    valid: "monthly",
  });

  // track user's current plan id
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  // also track current plan title + validity (monthly/yearly/payasyougo)
  const [currentPlanMeta, setCurrentPlanMeta] = useState<{
    titleNorm: string | null;
    valid: "monthly" | "yearly" | "payasyougo" | null;
  }>({ titleNorm: null, valid: null });

  const isSameTitle = (titleKey: string) =>
    !!currentPlanMeta.titleNorm && titleKey === currentPlanMeta.titleNorm;

  const {
    data: apiPlans,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recruiterPlans"],
    queryFn: fetchRecruiterPlans,
  });

  // session for auth to /user/single
  const { data: session, status } = useSession();

  const pricingPlans = useMemo(
    () => (apiPlans ? groupRecruiterPlans(apiPlans) : []),
    [apiPlans]
  );

  /* ----------------- Plan selection / payment flow ---------------- */

  const handlePlanSelect = (plan: LocalPlan) => {
    // If user already has this title and there is only one variant, do nothing
    const sameTitle = isSameTitle(plan.titleKey || normalizeTitle(plan.name));
    const onlyMonthly = plan.monthlyAmount != null && plan.annualAmount == null;
    const onlyYearly = plan.annualAmount != null && plan.monthlyAmount == null;

    // Hard stop for current plan (id or single-variant same title)
    if (sameTitle && (onlyMonthly || onlyYearly)) return;
    if (currentPlanId === plan.planId) return;

    setSelectedPlan(plan);

    if (plan.isPayAsYouGo) {
      const amountMatch = plan.description?.match(/\$(\d+(?:\.\d{2})?)/)?.[1];
      const amount = amountMatch ? parseFloat(amountMatch) : 0;
      setSelectedPrice(amount.toFixed(2));
      setSelectedPlanIdForPayment(plan.planId);
      setIsModalOpen(true);
      return;
    }

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

        // Banner (non-blocking)
        const apiPlan = result?.data?.plan;
        const bannerTitle = apiPlan?.title
          ? toDisplayName(apiPlan.title)
          : undefined;
        setPlanBanner(
          apiPlan ? { title: bannerTitle, valid: apiPlan.valid } : null
        );

        const titleNorm = apiPlan?.title ? normalizeTitle(apiPlan.title) : null;

        // normalize valid → monthly | yearly | payasyougo | null
        const vRaw = (apiPlan?.valid || "").toLowerCase().replace(/\s+/g, "");
        const valid =
          vRaw === "monthly"
            ? "monthly"
            : vRaw === "yearly"
            ? "yearly"
            : vRaw === "payasyougo"
            ? "payasyougo"
            : null;

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
          <h1 className="text-2xl font-semibold">
            No recruiter plans available
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-12 mt-[60px] text-center">
        <h1 className="mb-2 text-4xl font-bold text-gray-800">
          Recruiter Price List
        </h1>
        <p className="text-md text-gray-600">
          Please view our refunds policy in our Terms and Conditions, or ask our
          Chatbot about refunds.
        </p>
      </div>

      {planBanner && (
        <div className="mx-auto mb-4 w-full max-w-7xl rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
          You’re on <strong>{planBanner?.title}</strong>
          {planBanner?.valid ? ` (${planBanner.valid})` : ""}.
        </div>
      )}

      <div className="flex items-center justify-center bg-gray-50 py-16">
        {/* Plan Options Modal */}
        {showPlanOptions && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-[90%] max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-center text-xl font-bold">
                Select Payment Option for {selectedPlan.name}
              </h3>
              <div className="space-y-3">
                {selectedPlan.monthlyPriceLabel && (
                  <Button
                    className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handlePaymentOptionSelect(true)}
                    disabled={
                      !!isSameTitle(
                        selectedPlan.titleKey ||
                          normalizeTitle(selectedPlan.name)
                      ) && currentPlanMeta.valid === "monthly"
                    }
                  >
                    <div className="flex w-full items-center justify-between">
                      <span>Monthly: {selectedPlan.monthlyPriceLabel}</span>
                      {isSameTitle(
                        selectedPlan.titleKey ||
                          normalizeTitle(selectedPlan.name)
                      ) &&
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
                      !!isSameTitle(
                        selectedPlan.titleKey ||
                          normalizeTitle(selectedPlan.name)
                      ) && currentPlanMeta.valid === "yearly"
                    }
                  >
                    <div className="flex w-full items-center justify-between">
                      <span>Annual: {selectedPlan.annualPriceLabel}</span>
                      {isSameTitle(
                        selectedPlan.titleKey ||
                          normalizeTitle(selectedPlan.name)
                      ) &&
                        currentPlanMeta.valid === "yearly" && (
                          <span className="ml-2 rounded-full bg:white/20 px-2 py-[2px] text-xs">
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
        <div className="grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => {
            const cardIsCurrentByTitle = isSameTitle(
              plan.titleKey || normalizeTitle(plan.name)
            );
            const isCurrent =
              currentPlanId === plan.planId || cardIsCurrentByTitle;

            const titleColor = plan.titleColor ?? "#2B7FD0"; // 👈 main color for title

            return (
              <Card
                key={index}
                className="flex flex-col justify-between overflow-hidden rounded-xl border-none shadow-lg"
              >
                <CardHeader className="p-6 pb-0">
                  <CardTitle
                    className="text-base font-medium"
                    style={{ color: titleColor }}
                  >
                    {plan.name}
                    {isCurrent && (
                      <span
                        className="ml-2 rounded-full px-2 py-1 text-xs font-normal"
                        style={{
                          backgroundColor: `${titleColor}33`, // transparent background
                          color: titleColor,
                        }}
                      >
                        Current
                      </span>
                    )}
                  </CardTitle>

                  {/* Price row with responsive delimiter and clean spacing */}
                  <div className="mt-2">
                    {plan.description ? (
                      <p className="font-bold text-[#282828]">
                        {plan.description}
                      </p>
                    ) : (
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
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-grow p-6 pt-4">
                  <h3 className="mb-3 text-base font-medium text-[#8593A3]">
                    What you will get
                  </h3>
                  <ul className="space-y-2">
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
                    className="h-[58px] w-full rounded-[80px] text-lg font-semibold border-2 border-[#2B7FD0] bg-transparent text-[#2B7FD0] hover:bg-[#2B7FD0] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
