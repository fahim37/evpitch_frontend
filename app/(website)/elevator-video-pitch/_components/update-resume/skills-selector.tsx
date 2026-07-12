"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Search } from "lucide-react"

export const SkillsSelector = ({
  selectedSkills,
  onSkillsChange,
}: {
  selectedSkills: string[]
  onSkillsChange: (skills: string[]) => void
}) => {
  const [skillSearch, setSkillSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  const { data: skillsData, isLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/skill`)
      const data = await response.json()
      if (!data.success) throw new Error("Failed to fetch skills")
      return data.data.map((skill: any) => skill.name)
    },
  })

  const filteredSkills =
    skillsData?.filter(
      (skill: string) => skill.toLowerCase().includes(skillSearch.toLowerCase()) && !selectedSkills.includes(skill),
    ) || []

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      onSkillsChange([...selectedSkills, skill])
      setSkillSearch("")
      setShowDropdown(false)
    }
  }

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(selectedSkills.filter((skill) => skill !== skillToRemove))
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search and add skills..."
            value={skillSearch}
            onChange={(e) => {
              setSkillSearch(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="pl-10"
          />
        </div>

        {showDropdown && skillSearch && filteredSkills.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredSkills.slice(0, 10).map((skill: string) => (
              <button
                key={skill}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => addSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
              {skill}
              <button type="button" onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
