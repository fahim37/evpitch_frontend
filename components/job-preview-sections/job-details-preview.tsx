"use client"
import Link from "next/link"

interface JobDetailsPreviewProps {
  jobTitle: string
  department: string
  country: string
  region: string
  employmentType: string
  experience: string
  category: string
  compensation: string
  companyUrl: string
  expirationDate: string
  isEditing: boolean
  onFieldChange: (field: string, value: string) => void
}

export default function JobDetailsPreview({
  jobTitle,
  department,
  country,
  region,
  employmentType,
  experience,
  category,
  compensation,
  companyUrl,
  expirationDate,
  isEditing,
  onFieldChange,
}: JobDetailsPreviewProps) {
  const fields = [
    { label: "Job Title", value: jobTitle, key: "jobTitle" },
    { label: "Department", value: department, key: "department" },
    { label: "Country", value: country, key: "country" },
    { label: "Region/State", value: region, key: "region" },
    { label: "Employment Type", value: employmentType, key: "employmentType" },
    { label: "Experience Level", value: experience, key: "experience" },
    { label: "Job Category", value: category, key: "category" },
    { label: "Compensation", value: compensation, key: "compensation" },
    { label: "Company Website", value: companyUrl, key: "companyUrl", isLink: true },
    { label: "Job Posting Expiration Date", value: expirationDate, key: "expirationDate" },
  ]

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">Job Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{field.label}</p>
            {isEditing ? (
              <input
                type="text"
                value={field.value}
                onChange={(e) => onFieldChange(field.key, e.target.value)}
                className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 w-full"
              />
            ) : (
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {field.isLink && field.value ? (
                  <Link
                    href={field.value.startsWith("http") ? field.value : `https://${field.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {field.value}
                  </Link>
                ) : (
                  field.value || "N/A"
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
