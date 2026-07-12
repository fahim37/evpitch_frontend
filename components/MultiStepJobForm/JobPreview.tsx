"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Info, Check, X } from "lucide-react";
import Link from "next/link";
import CustomCalendar from "./CustomCalendar";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";

interface ApplicationRequirement {
  id: string;
  label: string;
  required: boolean;
}

interface CustomQuestion {
  id: string;
  question: string;
}

interface JobPostData {
  userId: string | undefined;
  companyId: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  companyUrl: string | undefined;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  experience: number;
  deadline: string;
  publishDate: string;
  status: string;
  jobCategoryId: string;
  employement_Type: string;
  compensation: string;
  archivedJob: boolean;
  applicationRequirement: { requirement: string }[];
  customQuestion: { question: string }[];
  careerStage: string;
  locationType: string;
}

interface JobPreviewProps {
  formData: {
    jobTitle: string;
    country: string;
    region: string;
    employement_Type: string;
    experience: string;
    category: string;
    categoryId: string;
    compensation?: string;
    expirationDate: string;
    jobDescription: string;
    publishDate?: string;
    companyUrl?: string;
    careerStage: string;
    locationType: string;
  };
  applicationRequirements: ApplicationRequirement[];
  customQuestions: CustomQuestion[];
  selectedDate: Date;
  publishNow: boolean;
  companyUrl: string | undefined;
  vacancy?: number;
  onBackToEdit: () => void;
}

async function postJob(data: JobPostData, retries = 2): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to publish job: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }

    return response.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying job post... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return postJob(data, retries - 1);
    }
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }
}

export default function JobPreview({
  formData,
  applicationRequirements,
  customQuestions,
  selectedDate,
  companyUrl,
  publishNow,
  onBackToEdit,
}: JobPreviewProps) {
  const companyId = "687b65e9153a2f59d4b57ba8"; // TODO: Replace with dynamic value
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();

  const { mutate: publishJob, isPending } = useMutation({
    mutationFn: postJob,
    onSuccess: () => {
      toast.success("Job published successfully!");
      router.push("/jobs");
    },
    onError: (error: Error) => {
      console.error("Error posting job:", error);
      toast.error(
        error.message || "An error occurred while publishing the job."
      );
    },
  });

  const handlePublish = () => {
    if (!userId) {
      toast.error("User not authenticated. Please log in.");
      return;
    }

    const responsibilities = formData.jobDescription
      .split("\n")
      .filter((line) => line.startsWith("* "))
      .map((line) => DOMPurify.sanitize(line.replace("* ", "").trim()))
      .filter((line) => line);

    const educationExperience = formData.jobDescription
      .split("\n")
      .filter((line) => line.startsWith("- "))
      .map((line) => DOMPurify.sanitize(line.replace("- ", "").trim()))
      .filter((line) => line);

    const benefits: string[] = [];
    const experienceYears: Record<string, number> = {
      entry: 0,
      mid: 3,
      senior: 5,
      executive: 10,
    };

    const experience = experienceYears[formData.experience.toLowerCase()] || 0;

    const getDeadline = () => {
      const days = Number.parseInt(formData.expirationDate) || 30;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + days);
      return deadline.toISOString();
    };

    const postData: JobPostData = {
      userId,
      companyId,
      title: DOMPurify.sanitize(formData.jobTitle || ""),
      description: DOMPurify.sanitize(formData.jobDescription || ""),
      salaryRange: DOMPurify.sanitize(formData.compensation || "Negotiable"),
      location: DOMPurify.sanitize(
        `${formData.country || "N/A"}, ${formData.region || "N/A"}`
      ),
      shift: formData.employement_Type === "full-time" ? "Day" : "Flexible",
      companyUrl: companyUrl ? DOMPurify.sanitize(companyUrl) : undefined,
      responsibilities,
      educationExperience,
      benefits,
      experience,
      deadline: getDeadline(),
      publishDate: publishNow
        ? new Date().toISOString()
        : formData.publishDate || selectedDate.toISOString(),
      status: "active",
      jobCategoryId: formData.categoryId || "",
      employement_Type: formData.employement_Type || "N/A",
      compensation: formData.compensation ? "Monthly" : "Negotiable",
      archivedJob: false,
      applicationRequirement: applicationRequirements
        .filter((req) => req.required)
        .map((req) => ({
          requirement: `${DOMPurify.sanitize(req.label)} required`,
        })),
      customQuestion: customQuestions
        .filter((q) => q.question)
        .map((q) => ({ question: DOMPurify.sanitize(q.question) })),
      careerStage: formData.careerStage || "N/A",
      locationType: formData.locationType || "N/A",
    };

    publishJob(postData);
  };

  const sanitizedDescription = DOMPurify.sanitize(
    formData.jobDescription || ""
  );

  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mx-auto">
            Preview Job Posting
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackToEdit}
            aria-label="Close preview"
          >
            <X className="h-6 w-6 text-gray-500" />
          </Button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Job Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Job Title</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.jobTitle || "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Country</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.country || "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Region/State</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.region || "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Employment Type
              </p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.employement_Type || "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Experience Level
              </p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.experience || "N/A"} Level
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Job Category</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.category || "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Compensation</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.compensation || "Negotiable"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Company Website
              </p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {companyUrl ? (
                  <Link
                    href={
                      companyUrl.startsWith("http")
                        ? companyUrl
                        : `https://${companyUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {companyUrl}
                  </Link>
                ) : (
                  "N/A"
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Job Posting Expiration Date
              </p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.expirationDate
                  ? `${formData.expirationDate} days`
                  : "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Career Stage</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.careerStage || "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Location Type</p>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {formData.locationType || "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Job Description
              </h2>
              <div className="space-y-4">
                <div
                  className="p-4 border border-gray-300 rounded-lg text-gray-800 whitespace-pre-wrap list-item list-none"
                  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start space-x-2 mb-4">
                  <Info className="h-5 w-5 text-[#9EC7DC]" />
                  <h3 className="text-base font-semibold text-[#9EC7DC]">
                    TIP
                  </h3>
                </div>
                <p className="text-base text-gray-800 mb-4">
                  To ensure that your job description matches the requirements
                  for the EVP job board, consider the following guidelines:
                </p>
                <ul className="list-disc list-inside text-base text-gray-800 space-y-2">
                  <li>Do not use discriminatory language</li>
                  <li>
                    Help the candidate understand the expectations for this role
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Publish Now
                  </h3>
                  <Switch
                    checked={publishNow}
                    disabled
                    className="data-[state=checked]:bg-[#2B7FD0]"
                  />
                </div>
                {!publishNow && (
                  <>
                    <h3 className="text-base font-semibold mb-4">
                      Schedule Publish
                    </h3>
                    <div className="border rounded-lg p-3">
                      <CustomCalendar
                        selectedDate={selectedDate}
                        onDateSelect={() => {}}
                        disabled
                      />
                    </div>
                    {selectedDate && (
                      <p className="text-sm text-gray-600 mt-2">
                        Selected date: {selectedDate.toLocaleDateString()}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Custom Questions
          </h2>
          <div className="space-y-4">
            {customQuestions.length > 0 ? (
              customQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <p className="text-xl font-medium text-[#2B7FD0]">
                    Ask a question
                  </p>
                  <div className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                    {question.question || "No question entered."}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xl text-gray-500">
                No custom questions added.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button
            variant="outline"
            className="w-full sm:w-[267px] h-12 border-[#2B7FD0] text-[#2B7FD0] hover:bg-transparent bg-transparent"
            onClick={onBackToEdit}
          >
            Back to Edit
          </Button>
          <Button
            className="w-full sm:w-[267px] h-12 bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white"
            onClick={handlePublish}
            disabled={isPending}
          >
            {isPending ? "Posting..." : "Post  your Job"}
          </Button>
        </div>
      </div>
    </div>
  );
}
