"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import CustomDateInput from "@/components/custom-date-input"
import type { UseFormReturn, FieldArrayWithId } from "react-hook-form"

interface AwardsSectionProps {
  form: UseFormReturn<any>
  awardFields: FieldArrayWithId<any, "awardsAndHonors", "id">[]
  appendAward: (value: any) => void
  removeAward: (index: number) => void
}

export function AwardsSection({ form, awardFields, appendAward, removeAward }: AwardsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Awards & Honors</CardTitle>
        <p className="text-sm text-muted-foreground">Highlight your achievements and recognitions.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {awardFields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name={`awardsAndHonors.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Award Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Employee of the Year" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`awardsAndHonors.${index}.programeName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Company Recognition Program" {...field} />
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
                      <FormLabel>Program Date</FormLabel>
                      <FormControl>
                        <CustomDateInput value={field.value} onChange={field.onChange} placeholder="MMYYYY" />
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
                    <FormLabel>Award Short Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Briefly describe the award and what you achieved" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="button" variant="destructive" size="sm" onClick={() => removeAward(index)}>
              Remove Award
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            appendAward({
              title: "",
              programeName: "",
              programeDate: "",
              description: "",
            })
          }
          className="flex items-center gap-2"
        >
          Add
        </Button>
      </CardContent>
    </Card>
  )
}
