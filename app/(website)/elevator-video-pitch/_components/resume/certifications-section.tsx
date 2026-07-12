"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";

interface CertificationsSectionProps {
  form: UseFormReturn<any>;
}

export function CertificationsSection({ form }: CertificationsSectionProps) {
  const [certificationInput, setCertificationInput] = useState("");

  const addCertification = (certification: string) => {
    if (certification.trim()) {
      const currentCertifications = form.getValues("certifications") || [];
      form.setValue("certifications", [
        ...currentCertifications,
        certification.trim(),
      ]);
      setCertificationInput("");
      form.trigger("certifications"); // Force form to re-render
    }
  };

  const removeCertification = (index: number) => {
    const currentCertifications = form.getValues("certifications") || [];
    const updatedCertifications = currentCertifications.filter(
      (_, i) => i !== index
    );
    form.setValue("certifications", updatedCertifications);
    form.trigger("certifications"); // Force form to re-render
  };

  const handleCertificationKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && certificationInput.trim()) {
      e.preventDefault();
      addCertification(certificationInput);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certifications</CardTitle>
        <p className="text-sm text-muted-foreground">
          List your professional certifications and credentials.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="certifications"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add Certification</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. AWS Certified Solutions Architect"
                      value={certificationInput}
                      onChange={(e) => setCertificationInput(e.target.value)}
                      onKeyPress={handleCertificationKeyPress}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => addCertification(certificationInput)}
                      disabled={!certificationInput.trim()}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Selected Certifications */}
          <div className="flex flex-wrap gap-2">
            {(form.getValues("certifications") || []).map(
              (certification: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200"
                >
                  {certification}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeCertification(index);
                    }}
                    className="h-4 w-4 p-0 text-red-500 hover:text-red-700 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            )}
          </div>

          {/* Helper message */}
          {!(form.getValues("certifications") || []).length && (
            <p className="text-sm text-gray-500">
              No certifications added yet. Add your professional certifications
              above.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
