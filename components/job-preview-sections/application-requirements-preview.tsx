"use client"

import { Button } from "@/components/ui/button"
import { Check, Trash2 } from "lucide-react"

interface ApplicationRequirement {
  id: string
  label: string
  required: boolean
}

interface ApplicationRequirementsPreviewProps {
  requirements: ApplicationRequirement[]
  isEditing: boolean
  onToggleRequired: (id: string, required: boolean) => void
  onRemove: (id: string) => void
}

export default function ApplicationRequirementsPreview({
  requirements,
  isEditing,
  onToggleRequired,
  onRemove,
}: ApplicationRequirementsPreviewProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Application Requirements</h2>
      <p className="text-xl text-gray-800 mb-6">What personal info would you like to gather about each applicant?</p>
      <div className="space-y-4">
        {requirements.map((requirement) => (
          <div key={requirement.id} className="flex items-center justify-between py-2 border-b pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-[22px] h-[22px] bg-[#2B7FD0] rounded-full flex items-center justify-center">
                <Check className="text-white w-4 h-4" />
              </div>
              <span className="text-xl text-gray-900 font-normal">{requirement.label}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={!requirement.required ? "default" : "outline"}
                className={`h-9 px-4 rounded-lg text-sm font-medium ${
                  !requirement.required ? "bg-[#2B7FD0] text-white" : "border-[#2B7FD0] text-[#2B7FD0]"
                }`}
                onClick={() => onToggleRequired(requirement.id, false)}
                disabled={!isEditing}
              >
                Optional
              </Button>
              <Button
                variant={requirement.required ? "default" : "outline"}
                className={`h-9 px-4 rounded-lg text-sm font-medium ${
                  requirement.required ? "bg-[#2B7FD0] text-white" : "border-[#2B7FD0] text-[#2B7FD0]"
                }`}
                onClick={() => onToggleRequired(requirement.id, true)}
                disabled={!isEditing}
              >
                Required
              </Button>
              {isEditing && (
                <Button type="button" variant="ghost" className="h-9 w-9 p-0" onClick={() => onRemove(requirement.id)}>
                  <Trash2 className="w-4 h-4 text-gray-600" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
