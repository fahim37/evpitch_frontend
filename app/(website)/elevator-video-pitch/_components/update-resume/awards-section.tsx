"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AwardsSectionProps {
  form: UseFormReturn<any>;
  awardFields: any[];
}

/* ---------- Helpers ---------- */

/** Convert ISO-ish date (e.g. "2025-01-01T00:00:00.000Z") or "YYYY-MM-DD" to "YYYY" */
const isoToYYYY = (iso?: unknown): string => {
  if (!iso || typeof iso !== "string") return "";
  const match = iso.match(/^(\d{4})-/); // captures year at start
  if (match) return match[1];
  // if it's already a 4-digit year
  if (/^\d{4}$/.test(iso)) return iso;
  return "";
};

/** Convert 4-digit year "YYYY" to ISO UTC string "YYYY-01-01T00:00:00.000Z" */
const yyyyToISO = (yyyy?: string): string => {
  if (!yyyy || !/^\d{4}$/.test(yyyy)) return "";
  const yearNum = Number(yyyy);
  if (Number.isNaN(yearNum)) return "";
  // optional validation range: 1900 <= year <= currentYear + 20
  const currentYear = new Date().getUTCFullYear();
  if (yearNum < 1900 || yearNum > currentYear + 20) return "";
  return new Date(Date.UTC(yearNum, 0, 1)).toISOString();
};

/* ---------- Simple 4-digit year input component ---------- */

function SimpleYearInput({
  value,
  onIsoChange,
  placeholder = "YYYY",
  disabled,
  className,
}: {
  value?: unknown; // field.value (could be ISO or already a year)
  onIsoChange: (isoOrEmpty: string) => void; // call with ISO string or "" to clear
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const initial = isoToYYYY(value);
  const [display, setDisplay] = React.useState<string>(initial);

  // sync when external value changes (e.g., form reset / load)
  React.useEffect(() => {
    const next = isoToYYYY(value);
    setDisplay((prev) => (prev === next ? prev : next));
  }, [value]);

  // When the input change: allow only digits and limit to 4
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    setDisplay(digits);
    // optional: immediate conversion when 4 digits typed:
    if (digits.length === 4) {
      const iso = yyyyToISO(digits);
      if (iso) onIsoChange(iso);
      else onIsoChange(""); // invalid year range -> clear
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // allow digits, backspace, delete, arrows, tab, ctrl/cmd combos
    if (
      !(
        /[0-9]/.test(e.key) ||
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Tab" ||
        e.ctrlKey ||
        e.metaKey
      )
    ) {
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    const trimmed = display.trim();
    if (!trimmed) {
      // cleared
      setDisplay("");
      onIsoChange("");
      return;
    }
    if (/^\d{4}$/.test(trimmed)) {
      const iso = yyyyToISO(trimmed);
      if (iso) {
        setDisplay(trimmed); // normalize
        onIsoChange(iso);
        return;
      }
    }
    // invalid year -> clear both display and stored value
    setDisplay("");
    onIsoChange("");
  };

  return (
    <Input
      value={display}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      maxLength={4}
    />
  );
}

/* ---------- Main component (full file) ---------- */

export const AwardsSection = ({ form, awardFields }: AwardsSectionProps) => {
  return (
    <div>
      <div className="mb-4 space-y-2">
        <h3>Awards & Honors (Optional)</h3>
        <p className="text-sm text-muted-foreground">
          Highlight your achievements and recognitions.
        </p>
      </div>
      <div>
        {awardFields.map((award, index) => {
          if (award.type === "delete") return null;

          return (
            <div
              key={award.id}
              className="space-y-4 rounded-lg border p-4 mb-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`awardsAndHonors.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Award Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Employee of the Year"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`awardsAndHonors.${index}.programeName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`awardsAndHonors.${index}.programeDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Received</FormLabel>
                      <FormControl>
                        <SimpleYearInput
                          value={field.value}
                          onIsoChange={(isoOrEmpty) => {
                            // store ISO or empty string in the form value
                            field.onChange(isoOrEmpty);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`awardsAndHonors.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the award and its significance"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {awardFields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const currentAwards =
                      form.getValues("awardsAndHonors") || [];
                    if (currentAwards[index]._id) {
                      form.setValue(`awardsAndHonors.${index}.type`, "delete");
                    } else {
                      form.setValue(
                        "awardsAndHonors",
                        currentAwards.filter((_: any, i: number) => i !== index)
                      );
                    }
                  }}
                >
                  Remove Award
                </Button>
              )}
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.setValue("awardsAndHonors", [
              ...(form.getValues("awardsAndHonors") || []),
              {
                type: "create",
                title: "",
                programeName: "",
                programeDate: "",
                description: "",
              },
            ]);
          }}
        >
          Add Award
        </Button>
      </div>
    </div>
  );
};

export default AwardsSection;
