"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal";
import { useSession } from "next-auth/react";

/* ----------------------------- Types ----------------------------- */

interface SubscriptionPlan {
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
  titleColor?: string; // 👈 from API (optional)
}

interface PlansApiResponse {
  success: boolean;
  message: string;
  data: SubscriptionPlan[];
}

interface UserApiResponse {
  success: boolean;
  message: string;
  data: {
    isValid?: boolean;
    plan?: {
      _id: string;
      title?: string;
      valid?: "monthly" | "yearly" | string;
    } | null;
  };
}

interface Feature {
  text: string;
}

type LocalPlan = {
  name: string;
  titleKey: string;
  monthlyPriceLabel?: string;
  annualPriceLabel?: string;
  monthlyAmount?: number;
  annualAmount?: number;
  planId: string;
  monthlyPlanId?: string;
  annualPlanId?: string;
  features: Feature[];
  buttonText: string;
  titleColor?: string; // 👈 propagated into UI
};

/* --------------------------- Utilities --------------------------- */

const normalizeTitle = (t: string) =>
  (t || "").replace(/\s+/g, " ").trim().toLowerCase();

// legacy helper (kept if needed elsewhere); logic now uses price==0 rather than title
const isFreeTitle = (name: string) => normalizeTitle(name) === "basic plan";

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

// Detect a free plan by price, not by title
const isZeroPriced = (p: LocalPlan) =>
  (p.monthlyAmount ?? p.annualAmount ?? Number.POSITIVE_INFINITY) === 0;

/* --------------------------- Data Fetch -------------------------- */

const fetchCandidatePlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`
  );
  if (!response.ok) throw new Error("Network response was not ok");
  const data: PlansApiResponse = await response.json();
  return data.data.filter((plan: SubscriptionPlan) => plan.for === "candidate");
};

const groupCandidatePlans = (plans: SubscriptionPlan[]): LocalPlan[] => {
  const map = new Map<
    string,
    { monthly?: SubscriptionPlan; yearly?: SubscriptionPlan }
  >();

  for (const p of plans) {
    const key = normalizeTitle(p.title);
    const bucket = map.get(key) ?? {};
    const v = (p.valid || "").toLowerCase();

    if (v === "monthly") bucket.monthly = p;
    else if (v === "yearly") bucket.yearly = p;
    else {
      if (/per\s*month/i.test(p.description)) bucket.monthly = p;
      else if (
        /per\s*ann?um/i.test(p.description) ||
        /per\s*year/i.test(p.description)
      )
        bucket.yearly = p;
      else bucket.monthly = p;
    }

    map.set(key, bucket);
  }

  const out: LocalPlan[] = [];
  for (const [title, g] of map.entries()) {
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
      features: (base.features || []).map((text) => ({ text })),
      buttonText: "Subscribe",
      planId: base._id,
      monthlyPlanId: g.monthly?._id,
      annualPlanId: g.yearly?._id,
      titleColor: base.titleColor, // 👈 carry API color through
    });
  }

  return out;
};

/* -------------------------- Component ---------------------------- */

export default function PricingList() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedPlanIdForPayment, setSelectedPlanIdForPayment] =
    useState<string>("");
  const [showPlanOptions, setShowPlanOptions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LocalPlan | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [userIsValid, setUserIsValid] = useState<boolean | null>(null);
  const [currentPlanMeta, setCurrentPlanMeta] = useState<{
    titleNorm: string | null;
    valid: "monthly" | "yearly" | null;
  }>({ titleNorm: null, valid: null });

  const isSameTitle = (planKey: string) =>
    !!currentPlanMeta.titleNorm && planKey === currentPlanMeta.titleNorm;

  const {
    data: apiPlans,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["candidatePlans"],
    queryFn: fetchCandidatePlans,
  });

  // Always show all plans including "Free of Charge"
  const pricingPlans = useMemo(() => {
    const apiPricingPlans = apiPlans ? groupCandidatePlans(apiPlans) : [];
    return apiPricingPlans;
  }, [apiPlans]);

  /* ------------------ Fetch current user & plan ------------------- */

  useEffect(() => {
    const fetchUserData = async () => {
      if (status !== "authenticated") return;
      const token = (session as any)?.accessToken;
      if (!token) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok)
          throw new Error(`GET /user/single failed with ${response.status}`);
        const result: UserApiResponse = await response.json();
        const apiPlan = result?.data?.plan ?? null;
        const isValid = Boolean(result?.data?.isValid);
        setUserIsValid(isValid);

        if (apiPlan) {
          const titleNorm = apiPlan?.title
            ? normalizeTitle(apiPlan.title)
            : null;
          const vRaw = (apiPlan?.valid || "")
            .toLowerCase()
            .replace(/\s+/g, "");
          const valid =
            vRaw === "monthly"
              ? "monthly"
              : vRaw === "yearly"
              ? "yearly"
              : null;
          setCurrentPlanId(apiPlan?._id ?? null);
          setCurrentPlanMeta({ titleNorm, valid });
        } else {
          setCurrentPlanId(null);
          setCurrentPlanMeta({ titleNorm: null, valid: null });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setUserIsValid(null);
      }
    };
    fetchUserData();
  }, [session, status]);

  /* -------------------- Plan selection --------------------- */

  const handlePlanSelect = (plan: LocalPlan) => {
    // If the user hasn't paid (isValid === false), the zero-priced plan is "Current" -> block selection.
    if (userIsValid === false && isZeroPriced(plan)) return;

    const sameTitle = isSameTitle(plan.titleKey);
    const onlyMonthly = plan.monthlyAmount != null && plan.annualAmount == null;
    const onlyYearly = plan.annualAmount != null && plan.monthlyAmount == null;

    // Hard stop for current plan
    if (sameTitle && (onlyMonthly || onlyYearly)) return;
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

  /* -------------------- Derived for banner ------------------------ */

  // find the $0 plan from the grouped list
  const freePlan = useMemo(
    () => pricingPlans.find((p) => isZeroPriced(p)) ?? null,
    [pricingPlans]
  );
  const showFreeBanner = userIsValid === false && !!freePlan;

  const currentPlanLabel = currentPlanMeta.titleNorm
    ? toDisplayName(currentPlanMeta.titleNorm)
    : null;

  // 🔹 find matching plan and use its titleColor (fallback to default)
  const currentPlanTitleColor = useMemo(() => {
    if (!currentPlanMeta.titleNorm) return "#2B7FD0";

    const match = pricingPlans.find(
      (p) => p.titleKey === currentPlanMeta.titleNorm
    );

    return match?.titleColor ?? "#2B7FD0";
  }, [pricingPlans, currentPlanMeta.titleNorm]);

  // 🔹 is the user's current plan the free ($0) one?
  const currentPlanIsFree = useMemo(() => {
    if (!currentPlanMeta.titleNorm) return false;

    const match = pricingPlans.find(
      (p) => p.titleKey === currentPlanMeta.titleNorm
    );

    return match ? isZeroPriced(match) : false;
  }, [pricingPlans, currentPlanMeta.titleNorm]);

  /* ----------------------------- UI ------------------------------ */

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-semibold">Loading plans...</h1>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-500">
            Error loading plans
          </h1>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Candidate Price List
        </h1>
        <p className="text-md text-gray-600">
          Please view our refunds policy in our Terms and Conditions, or ask our
          Chatbot about refunds.
        </p>
      </div>

      {/* Banner logic */}
      {currentPlanLabel && (
        <div className="mx-auto container max-w-[600px] mb-8 w-full rounded-lg border border-[#2B7FD0] p-4 text-center">
          You&apos;re currently on our{" "}
          <strong style={{ color: currentPlanTitleColor }}>
            {currentPlanLabel}
          </strong>{" "}
          {currentPlanMeta.valid ? `(${currentPlanMeta.valid})` : ""}.
        </div>
      )}

      <div className="flex items-center justify-center">
        <div className="grid w-full max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricingPlans.map((plan, index) => {
            const cardIsCurrentByTitle = isSameTitle(plan.titleKey);
            // For display-only places, you can still use title if helpful
            const isFreeByTitle = isFreeTitle(plan.name);
            const zeroPriced = isZeroPriced(plan);

            // If user has no plan info, mark the $0 plan as default current
            const freeIsDefaultCurrent =
              !currentPlanMeta.titleNorm && zeroPriced;

            // If user isn't valid (hasn't paid), force $0 plan as current
            const forcedFreeCurrent = userIsValid === false && zeroPriced;

            const isCurrent =
              forcedFreeCurrent ||
              cardIsCurrentByTitle ||
              currentPlanId === plan.planId ||
              freeIsDefaultCurrent;

            const titleColor = plan.titleColor ?? "#2B7FD0";

            // ⬇️ If user is on paid plan (currentPlanIsFree === false)
            // and this card is the free ($0) plan, disable this button.
            const isDowngradeToFree =
              zeroPriced && !currentPlanIsFree && !!currentPlanMeta.titleNorm;

            return (
              <Card
                key={index}
                className="flex flex-col justify-between shadow-lg border-none rounded-xl overflow-hidden"
              >
                <CardHeader className="p-6 pb-0">
                  <CardTitle
                    className="text-base font-medium"
                    style={{ color: titleColor }} // 👈 use titleColor
                  >
                    {plan.name}
                    {isCurrent && (
                      <span
                        className="ml-2 rounded-full px-2 py-1 text-xs font-normal"
                        style={{
                          backgroundColor: `${titleColor}33`, // hex + 20% alpha
                          color: titleColor,
                        }}
                      >
                        Current
                      </span>
                    )}
                  </CardTitle>

                  {/* Hide price labels for the $0 plan */}
                  {!zeroPriced && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-[18px] flex-wrap">
                        {plan.monthlyPriceLabel && (
                          <p className="font-bold text-[#282828]">
                            {plan.monthlyPriceLabel}
                          </p>
                        )}
                        {plan.annualPriceLabel && (
                          <p className="font-bold text-[#282828]">
                            {plan.annualPriceLabel}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-6 pt-4 flex-grow">
                  <h3 className="font-medium text-base text-[#8593A3] mb-3">
                    What you will get
                  </h3>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#2B7FD0]">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-base text-[#343434] font-medium">
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
                    disabled={isCurrent || isDowngradeToFree}
                  >
                    {isCurrent
                      ? "Current Plan"
                      : isDowngradeToFree
                      ? plan.buttonText
                      : plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ✅ Payment Method Modal */}
      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        price={selectedPrice || "0.00"}
        planId={selectedPlanIdForPayment}
      />

      {/* ✅ Monthly/Yearly Choice Modal */}
      {showPlanOptions && selectedPlan && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-center text-gray-800">
              Choose your subscription type
            </h2>
            <div className="flex flex-col gap-3">
              {selectedPlan.monthlyAmount != null && (
                <Button
                  className="w-full h-[50px] text-base font-semibold border border-[#2B7FD0] text-[#2B7FD0] hover:bg-[#2B7FD0] text-white"
                  onClick={() => handlePaymentOptionSelect(true)}
                >
                  Monthly — ${selectedPlan.monthlyAmount.toFixed(2)}
                </Button>
              )}
              {selectedPlan.annualAmount != null && (
                <Button
                  className="w-full h-[50px] text-base font-semibold border border-[#2B7FD0] text-[#2B7FD0] hover:bg-[#2B7FD0] text-white"
                  onClick={() => handlePaymentOptionSelect(false)}
                >
                  Yearly — ${selectedPlan.annualAmount.toFixed(2)}
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              className="mt-4 w-full text-gray-500 hover:text-gray-700"
              onClick={() => setShowPlanOptions(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
