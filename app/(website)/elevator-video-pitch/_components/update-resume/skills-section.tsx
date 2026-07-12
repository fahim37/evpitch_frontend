"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { SkillsSelector } from "./skills-selector"
import type { UseFormReturn } from "react-hook-form"

interface SkillsSectionProps {
  form: UseFormReturn<any>
  selectedSkills: string[]
  setSelectedSkills: (skills: string[]) => void
}

export const SkillsSection = ({ form, selectedSkills, setSelectedSkills }: SkillsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SkillsSelector
                  selectedSkills={selectedSkills}
                  onSkillsChange={(skills) => {
                    setSelectedSkills(skills)
                    field.onChange(skills)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
