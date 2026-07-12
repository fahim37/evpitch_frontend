"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
}

export function LanguageSelector({
  selectedLanguages,
  onLanguagesChange,
}: LanguageSelectorProps) {
  const [languageSearch, setLanguageSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: languagesData, isLoading } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/language`
      );
      const data = await response.json();
      if (data.status !== "success" || !Array.isArray(data.data)) {
        throw new Error("Failed to fetch universities");
      }
      return data.data.map((language: any) => language.name || language);
    },
  });

  const filteredLanguages =
    languagesData?.filter(
      (language: string) =>
        language.toLowerCase().includes(languageSearch.toLowerCase()) &&
        !selectedLanguages.includes(language)
    ) || [];

  const addLanguage = (language: string) => {
    if (!selectedLanguages.includes(language)) {
      onLanguagesChange([...selectedLanguages, language]);
      setLanguageSearch("");
      setShowDropdown(false);
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    onLanguagesChange(
      selectedLanguages.filter((language) => language !== languageToRemove)
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search and add languages..."
            value={languageSearch}
            onChange={(e) => {
              setLanguageSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>

        {showDropdown && languageSearch && filteredLanguages.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredLanguages.slice(0, 10).map((language: string) => (
              <button
                key={language}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => addLanguage(language)}
              >
                {language}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLanguages.map((language) => (
            <Badge
              key={language}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {language}
              <button
                type="button"
                onClick={() => removeLanguage(language)}
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
