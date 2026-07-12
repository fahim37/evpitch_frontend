"use client"

import type { UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { JobFormData } from "@/types/job";

interface FinishStepProps {
  form: UseFormReturn<JobFormData>
  onPreview: () => void
  onPublish: () => void
  isPending: boolean
}

export default function FinishStep({ form, onPreview, onPublish, isPending }: FinishStepProps) {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Card className="w-full max-w-2xl border-none shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-semibold text-[#131313] mb-8">Your job posting is ready!</h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-[267px] h-12 border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent bg-transparent"
                onClick={onPreview}
              >
                Preview Your Post
              </Button>
              <Button
                type="button"
                className="w-full sm:w-[267px] h-12 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white"
                onClick={onPublish}
                disabled={isPending}
              >
                {isPending ? "Posting..." : "Post  your Job"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
