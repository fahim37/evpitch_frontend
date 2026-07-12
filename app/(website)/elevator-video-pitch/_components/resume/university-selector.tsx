"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UniversitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function UniversitySelector({
  value,
  onChange,
  placeholder = "Search for university...",
}: UniversitySelectorProps) {
  const [universitySearch, setUniversitySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: universitiesData, isLoading } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/university`
      );
      const data = await response.json();
      if (!data.success) throw new Error("Failed to fetch universities");
      return data.data.map((university: any) => university.name || university);
    },
  });

  const filteredUniversities =
    universitiesData?.filter((university: string) =>
      university.toLowerCase().includes(universitySearch.toLowerCase())
    ) || [];

  const handleUniversitySelect = (university: string) => {
    onChange(university);
    setUniversitySearch("");
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={universitySearch || value}
          onChange={(e) => {
            setUniversitySearch(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) {
              onChange("");
            }
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="pl-10"
          disabled={isLoading}
        />
      </div>

      {showDropdown && universitySearch && filteredUniversities.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredUniversities.slice(0, 10).map((university: string) => (
            <button
              key={university}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onClick={() => handleUniversitySelect(university)}
            >
              {university}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
