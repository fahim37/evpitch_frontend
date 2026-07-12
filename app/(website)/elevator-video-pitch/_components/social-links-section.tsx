"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

interface SocialLinkRow {
  label: string; // stored/posted label (normalized)
  url: string;
}

interface SocialLinksSectionProps {
  form: UseFormReturn<any>;
}

const BASE_PLATFORMS = [
  "LinkedIn",
  "Twitter",
  "Facebook",
  "TikTok",
  "Instagram",
  "Upwork",
  "Fiverr",
] as const;

type BasePlatform = (typeof BASE_PLATFORMS)[number];

const NORMALIZED_OTHER_LABEL = "Others" as const;
type StorageKey = BasePlatform | typeof NORMALIZED_OTHER_LABEL | "Other";

// For placeholders
const PLATFORM_PLACEHOLDER: Record<string, string> = {
  LinkedIn: "https://www.linkedin.com/your-profile",
  Twitter: "https://www.twitter.com/your-profile",
  Facebook: "https://facebook.com/your-profile",
  TikTok: "https://www.tiktok.com/@your-handle",
  Instagram: "https://www.instagram.com/your-profile",
  Upwork: "https://www.upwork.com/your-profile",
  Fiverr: "https://www.fiverr.com/your-username",
  "Company Website": "https://your-website.com",
  "Portfolio Website": "https://your-website.com",
  Other: "https://your-website.com",
};

export function SocialLinksSection({ form }: SocialLinksSectionProps) {
  const session = useSession();
  const role = session.data?.user?.role;

  // UI-only label for the last field
  const dynamicOtherLabel: "Company Website" | "Portfolio Website" | "Other" =
    role === "recruiter" || role === "company"
      ? "Company Website"
      : role === "candidate"
      ? "Portfolio Website"
      : "Other";

  // Only normalize to "Others" for Company/Portfolio UI cases
  const normalizeToOthers =
    dynamicOtherLabel === "Company Website" ||
    dynamicOtherLabel === "Portfolio Website";

  // Helper: normalize arbitrary incoming label text to a storage key
  const normalizeIncomingLabelToKey = (raw: string): StorageKey => {
    const s = (raw || "").trim().toLowerCase();
    if (s === "company website" || s === "portfolio website" || s === "others")
      return "Others";
    if (s === "other") return "Other";
    // match to known base platforms
    const found = (BASE_PLATFORMS as readonly string[]).find(
      (p) => p.toLowerCase() === s
    );
    return (found as BasePlatform) ?? (raw as StorageKey);
  };

  // Helper: for a given UI label, what storage keys should we try (in order)?
  // This lets us populate correctly whether the saved data used "Other" or "Others".
  const candidateKeysForUiLabel = (
    uiLabel: string
  ): StorageKey[] => {
    if (uiLabel === dynamicOtherLabel) {
      // If we currently normalize to Others (Company/Portfolio UI), prefer "Others" then "Other"
      if (normalizeToOthers) return ["Others", "Other"];
      // If UI shows plain "Other", prefer "Other" but still accept legacy "Others"
      return ["Other", "Others"];
    }
    return [uiLabel as BasePlatform];
  };

  // Fixed platforms + dynamic UI label at the end
  const FIXED_PLATFORMS = useMemo(
    () => [...BASE_PLATFORMS, dynamicOtherLabel],
    [dynamicOtherLabel]
  );

  // Build a lookup by normalized storage key from whatever is currently in the form
  const existingLookup = useMemo(() => {
    const existing: SocialLinkRow[] = form.getValues("sLink") ?? [];
    const byKey: Record<string, SocialLinkRow> = {};
    for (const item of existing) {
      const key = normalizeIncomingLabelToKey(item.label);
      // Only keep the first non-empty url we see for a key
      if (!byKey[key] || !!item.url) {
        byKey[key] = { label: key, url: item.url ?? "" };
      }
    }
    return byKey;
    // do NOT include FIXED_PLATFORMS here; we only want to read once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Initialize values with per-field lookup (label-based, not index-based)
  const initialLinks: SocialLinkRow[] = useMemo(() => {
    return FIXED_PLATFORMS.map((uiLabel) => {
      // decide the storage key we will POST for this UI row
      const storageKey: StorageKey =
        uiLabel === dynamicOtherLabel
          ? normalizeToOthers
            ? "Others"
            : "Other"
          : (uiLabel as BasePlatform);

      // when populating URL, try candidate keys (to tolerate legacy or different roles)
      const candidates = candidateKeysForUiLabel(uiLabel);
      const existingMatch =
        existingLookup[candidates[0]] ||
        existingLookup[candidates[1]] ||
        existingLookup[candidates[2]];

      return {
        label: storageKey, // what we will submit
        url: existingMatch?.url ?? "",
      };
    });
  }, [
    FIXED_PLATFORMS,
    dynamicOtherLabel,
    normalizeToOthers,
    existingLookup,
  ]);

  const sectionTitle =
    role === "company"
      ? "Company Social Media Links"
      : "Professional Social Media and Website Links";

  // Seed the form one time whenever inputs change
  useEffect(() => {
    form.setValue("sLink", initialLinks, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [form, initialLinks]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div>
            <CardTitle className="text-md font-medium text-gray-900">
              {sectionTitle}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIXED_PLATFORMS.map((uiLabel, index) => {
            // storage key we will submit for this UI row
            const storageKey: StorageKey =
              uiLabel === dynamicOtherLabel
                ? normalizeToOthers
                  ? "Others"
                  : "Other"
                : (uiLabel as BasePlatform);

            return (
              <FormField
                key={`${uiLabel}-${index}`}
                control={form.control}
                name={`sLink.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{uiLabel} URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          PLATFORM_PLACEHOLDER[uiLabel] ??
                          "https://your-website.com"
                        }
                        {...field}
                      />
                    </FormControl>

                    {/* Hidden input ensures label is the normalized storage key */}
                    <input
                      type="hidden"
                      value={storageKey}
                      {...form.register(`sLink.${index}.label`)}
                    />

                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
