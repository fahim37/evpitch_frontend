"use client";

import { useEffect } from "react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Trash2 } from "lucide-react";
import type { JobFormData } from "@/types/job";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ApplicationRequirementsStepProps {
  form: UseFormReturn<JobFormData>;
  onNext: () => void;
  onCancel: () => void;
}

export default function ApplicationRequirementsStep({
  form,
  onNext,
  onCancel,
}: ApplicationRequirementsStepProps) {
  const {
    fields: applicationRequirements,
    update: updateRequirement,
    remove,
    append,
  } = useFieldArray({
    control: form.control,
    name: "applicationRequirements",
  });

  useEffect(() => {
    if (!applicationRequirements || applicationRequirements.length === 0) {
      append({ requirement: "Resume", status: undefined });
      append({
        requirement: "Have you got a valid visa for this location?",
        status: undefined,
      });
      return;
    }

    // Normalize old format {label, status} → {requirement, status}
    applicationRequirements.forEach((req, idx) => {
      if ((req as any).label && !(req as any).requirement) {
        updateRequirement(idx, {
          requirement: (req as any).label,
          status: (req as any).status ?? undefined,
        } as any);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationRequirements.length]);

  return (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#000000]">
            Application Requirements
          </h2>
        </div>
        <p className="text-xl text-[#000000] mb-6">
          What further details would you like to gather about each applicant?
        </p>

        <div className="space-y-4">
          {applicationRequirements.map((requirement, index) => {
            const label = requirement.requirement ?? "";

            return (
              <div
                key={requirement.id}
                className="flex items-start justify-between py-2 border-b pb-6"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-[22px] h-[22px] bg-[#2B7FD0] rounded-full flex items-center justify-center mt-1">
                    <Check className="text-white w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xl text-[#000000] font-normal">
                      {label}
                    </div>

                    {requirement.status ? (
                      <div className="text-sm text-gray-500 mt-1">
                        {requirement.status}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Select
                    value={requirement.status ?? undefined}
                    onValueChange={(val) =>
                      updateRequirement(index, {
                        ...requirement,
                        status: val,
                      })
                    }
                  >
                    <SelectTrigger className="w-48 h-9">
                      <SelectValue placeholder="Set status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Required">Required</SelectItem>
                      <SelectItem value="Optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 p-0"
                    onClick={() => remove(index)}
                    aria-label={`Remove ${label}`}
                  >
                    <Trash2 className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 px-6 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 bg-transparent"
            onClick={onCancel}
          >
            Back
          </Button>
          <Button
            type="button"
            className="h-11 px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 rounded-lg text-white"
            onClick={onNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
