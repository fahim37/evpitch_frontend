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

export const UniversitySelector = ({
  value,
  onChange,
  placeholder,
}: UniversitySelectorProps) => {
  const [search, setSearch] = useState(value || "");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: universities, isLoading } = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/university`
      );
      const data = await response.json();
      if (data.status !== "success" || !Array.isArray(data.data)) {
        throw new Error("Failed to fetch universities");
      }
      return data.data.map((uni: any) => uni.name);
    },
  });

  const filteredUniversities =
    universities?.filter((uni: string) =>
      uni.toLowerCase().includes(search.toLowerCase())
    ) || [];

  const selectUniversity = (uni: string) => {
    setSearch(uni);
    onChange(uni);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={
            placeholder || "Search for university/college/high-school..."
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="pl-10"
        />
      </div>

      {showDropdown && search && filteredUniversities.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredUniversities.slice(0, 10).map((uni: string) => (
            <button
              key={uni}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onClick={() => selectUniversity(uni)}
            >
              {uni}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
