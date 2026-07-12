"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Info } from "lucide-react"
import TextEditor from "../MultiStepJobForm/TextEditor"
import CustomCalendar from "../CustomCalendar"
import DOMPurify from "dompurify"

interface JobDescriptionPreviewProps {
  jobDescription: string
  publishNow: boolean
  selectedDate: Date | undefined
  isEditing: boolean
  onDescriptionChange: (value: string) => void
  onPublishNowChange: (value: boolean) => void
  onDateChange: (date: Date | undefined) => void
}

export default function JobDescriptionPreview({
  jobDescription,
  publishNow,
  selectedDate,
  isEditing,
  onDescriptionChange,
  onPublishNowChange,
  onDateChange,
}: JobDescriptionPreviewProps) {
  const sanitizedDescription = DOMPurify.sanitize(jobDescription)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 bg-white">
      <Card className="lg:col-span-2 border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Description</h2>
          <div className="space-y-4">
            {isEditing ? (
              <TextEditor value={jobDescription} onChange={onDescriptionChange} />
            ) : (
              <div
                className="p-4 border border-gray-300 rounded-lg text-gray-800 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Tips and Publish Schedule */}
      <div className="lg:col-span-1 space-y-6">
        {/* TIP Section */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start space-x-2 mb-4">
              <Info className="h-5 w-5 text-[#9EC7DC]" />
              <h3 className="text-base font-semibold text-[#9EC7DC]">TIP</h3>
            </div>
            <p className="text-base text-gray-800 mb-4">
              Job boards will often reject jobs that do not have quality job descriptions. To ensure that your job
              description matches the requirements for job boards, consider the following guidelines:
            </p>
            <ul className="list-disc list-inside text-base text-gray-800 space-y-2">
              <li>Job descriptions should be clear, well-written, and informative</li>
              <li>Job descriptions with 700-2,000 characters get the most interaction</li>
              <li>Do not use discriminatory language</li>
              <li>Do not post offensive or inappropriate content</li>
              <li>Be honest about the job requirement details</li>
              <li>Help the candidate understand the expectations for this role</li>
            </ul>
          </CardContent>
        </Card>

        {/* Publish Schedule Section */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Publish Now</h3>
              {isEditing ? (
                <Switch className="!bg-[#2B7FD0]" checked={publishNow} onCheckedChange={onPublishNowChange} />
              ) : (
                <Switch className="!bg-[#2B7FD0]" checked={publishNow} disabled />
              )}
            </div>
            {!publishNow && (
              <>
                <h3 className="text-base font-semibold mb-4">Schedule Publish</h3>
                <div className="border rounded-lg p-3">
                  <CustomCalendar selectedDate={selectedDate} onDateSelect={onDateChange} />
                </div>
                {selectedDate && (
                  <p className="text-sm text-gray-600 mt-2">Selected date: {selectedDate.toLocaleDateString()}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
