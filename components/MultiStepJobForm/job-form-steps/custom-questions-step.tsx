"use client"

import { type UseFormReturn, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { JobFormData } from "@/types/job";

interface CustomQuestion {
  id: string
  question: string
}



interface CustomQuestionsStepProps {
  form: UseFormReturn<JobFormData>
  onNext: () => void
  onCancel: () => void
}

export default function CustomQuestionsStep({ form, onNext, onCancel }: CustomQuestionsStepProps) {
  const { fields: customQuestions, append: appendCustomQuestion } = useFieldArray({
    control: form.control,
    name: "customQuestions",
  })

  return (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#000000]">Add Custom Questions</h2>
          <Button
            type="button"
            className="border border-[#2B7FD0] h-9 px-4 text-sm text-[#2B7FD0] hover:bg-transparent bg-transparent"
            variant="outline"
            onClick={onNext}
          >
            Skip
          </Button>
        </div>
       
        <div className="space-y-4 mb-6">
          {customQuestions.map((question, index) => (
            <FormField
              key={question.id}
              control={form.control}
              name={`customQuestions.${index}.question`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-medium text-[#2B7FD0]">Ask a question</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Write Here"
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => appendCustomQuestion({ id: Date.now().toString(), question: "" })}
          className="border-none mb-6 text-[#2B7FD0] flex items-center justify-center text-xl font-medium hover:text-[#2B7FD0] hover:bg-transparent"
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 bg-[#2B7FD0]">
            <Plus className="w-4 h-4 text-white" />
          </div>
          Add a question
        </Button>
        <div className="flex justify-end gap-4">
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
  )
}
