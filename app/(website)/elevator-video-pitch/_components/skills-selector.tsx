"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { FormLabel } from "@/components/ui/form";

interface Skill {
  _id: string;
  name: string;
}

interface SkillsSelectorProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  error?: string; // 👈 NEW
}

export function SkillsSelector({
  selectedSkills,
  onSkillsChange,
  error,
}: SkillsSelectorProps) {
  const [skillSearch, setSkillSearch] = useState("");
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch skills
  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/skill`);
        const data = await response.json();
        if (data.success) setAllSkills(data.data);
      } catch (err) {
        console.error("Error fetching skills:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSkills();
  }, []);

  // Filter logic
  useEffect(() => {
    if (skillSearch.trim()) {
      const filtered = allSkills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
          !selectedSkills.includes(skill.name)
      );
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills([]);
    }
  }, [skillSearch, allSkills, selectedSkills]);

  const addSkill = (skillName: string) => {
    if (!selectedSkills.includes(skillName)) {
      onSkillsChange([...selectedSkills, skillName]);
    }
    setSkillSearch("");
  };

  const removeSkill = (skillName: string) => {
    onSkillsChange(selectedSkills.filter((skill) => skill !== skillName));
  };

  return (
    <div className="space-y-2">
      <FormLabel>Skills*</FormLabel>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search and add skills (e.g., Java, PHP, React...)"
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          className={`pl-10 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
        />

        {/* Loading */}
        {isLoading && skillSearch && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow p-2 text-sm text-gray-600">
            Loading skills...
          </div>
        )}

        {/* Dropdown */}
        {filteredSkills.length > 0 && !isLoading && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow max-h-40 overflow-y-auto">
            {filteredSkills.slice(0, 10).map((skill) => (
              <button
                key={skill._id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => addSkill(skill.name)}
              >
                {skill.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Skills */}
      <div className="flex flex-wrap gap-2">
        {selectedSkills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            {skill}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
          </Badge>
        ))}
      </div>

      {/* Helper / Error messages */}
      {!selectedSkills.length && !error && (
        <p className="text-sm text-gray-500">
          No skills selected. Start typing to search and add skills.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
