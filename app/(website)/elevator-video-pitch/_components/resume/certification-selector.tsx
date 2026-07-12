"use client";

import type React from "react";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CertificationSelectorProps {
  selectedCertifications: string[];
  onCertificationsChange: (certifications: string[]) => void;
}

export function CertificationSelector({
  selectedCertifications,
  onCertificationsChange,
}: CertificationSelectorProps) {
  const [certificationInput, setCertificationInput] = useState("");

  const addCertification = () => {
    const trimmedInput = certificationInput.trim();
    if (trimmedInput && !selectedCertifications.includes(trimmedInput)) {
      onCertificationsChange([...selectedCertifications, trimmedInput]);
      setCertificationInput("");
    }
  };

  const removeCertification = (certificationToRemove: string) => {
    onCertificationsChange(
      selectedCertifications.filter((cert) => cert !== certificationToRemove)
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCertification();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Enter certification name..."
            value={certificationInput}
            onChange={(e) => setCertificationInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <Button
          type="button"
          onClick={addCertification}
          disabled={!certificationInput.trim()}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {selectedCertifications.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCertifications.map((certification) => (
            <Badge
              key={certification}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {certification}
              <button
                type="button"
                onClick={() => removeCertification(certification)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
