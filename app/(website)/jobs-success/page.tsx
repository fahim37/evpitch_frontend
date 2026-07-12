import { Check,  } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <div className="w-24 h-24 bg-[#28a745] rounded-full flex items-center justify-center mb-6">
        <Check className="w-12 h-12 text-white stroke-[3px]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-3">Nice Work</h2>
      <p className="text-center text-gray-600 max-w-md leading-relaxed mb-8">
        Once moderated, your job will be posted to our job boards promptly, or at your scheduled time.
      </p>
      <Link href="/recruiter-dashboard">
      <Button className="bg-[#007bff] hover:bg-[#0069d9] text-white px-6 py-3 rounded-md text-base">
        Return To Dashboard
      </Button>
      </Link>
    </div>
  )
}
