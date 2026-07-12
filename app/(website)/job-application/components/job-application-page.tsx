"use client";
import type React from "react";
import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Resume {
  id: string;
  name: string;
  lastUsed: string;
  url?: string;
  selected?: boolean;
}

interface slink {
  label: string;
  url: string;
  _id: string;
}
interface UserData {
  id?: string;
  name?: string;
  avatar?: { url: string };
  address?: string;
  email?: string;
  phoneNum?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  dribbbleUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  role?: string;
  sLink?: slink[];
}

interface UserDataResponse {
  data: UserData;
}

interface CustomQuestion {
  question: string;
  _id: string;
}

interface ApplicationRequirement {
  requirement: string;
  status: string;
  _id: string;
}

interface JobDetailsResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    title: string;
    customQuestion: CustomQuestion[];
    applicationRequirement: ApplicationRequirement[];
  };
}

interface JobApplicationPageProps {
  jobId: string;
}

export default function JobApplicationPage({ jobId }: JobApplicationPageProps) {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const router = useRouter();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [agreedToShareCV, setAgreedToShareCV] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [hasValidVisa, setHasValidVisa] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_BASE_URL is not defined");
    toast.error("Application configuration error. Please contact support.");
  }

  // Fetch user data
  const { data, isLoading } = useQuery<UserDataResponse>({
    queryKey: ["user", token],
    queryFn: async () => {
      if (!token || !baseUrl) throw new Error("Missing token or base URL");
      const response = await fetch(`${baseUrl}/user/single`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch user data");
      return response.json();
    },
    enabled: !!token,
  });

  // Fetch job data
  const { data: jobData, isLoading: isJobLoading } =
    useQuery<JobDetailsResponse>({
      queryKey: ["job", jobId],
      queryFn: async () => {
        if (!jobId || jobId === "undefined") throw new Error("Invalid job ID");
        const response = await fetch(`${baseUrl}/jobs/${jobId}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.success)
          throw new Error(data.message || "Failed to fetch job details");
        return data as JobDetailsResponse;
      },
      enabled: Boolean(jobId && jobId !== "undefined"),
    });

  const isResumeRequired = jobData?.data.applicationRequirement?.some(
    (req) => req.requirement === "Resume" && req.status === "Required",
  );
  const isResumeOptional = jobData?.data.applicationRequirement?.some(
    (req) => req.requirement === "Resume" && req.status === "Optional",
  );
  const visaRequirementLabel = "Have you got a valid visa for this location?";
  const visaRequirement = jobData?.data.applicationRequirement?.find(
    (req) =>
      req.requirement?.trim().toLowerCase() ===
      visaRequirementLabel.toLowerCase(),
  );
  const shouldAskVisaStatus = Boolean(visaRequirement);
  const isVisaRequired =
    (visaRequirement?.status || "").toLowerCase() === "required";

  // Upload resume mutation
  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!token || !baseUrl) throw new Error("Missing token or base URL");
      const formData = new FormData();
      formData.append("resumes", file);
      formData.append("userId", userId || "");

      const response = await fetch(`${baseUrl}/resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload resume");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Resume uploaded successfully!");
      const newResume: Resume = {
        id: data.data?._id || Date.now().toString(),
        name:
          data.data?.file[0]?.filename ||
          uploadedFile?.name ||
          "Uploaded Resume.pdf",
        lastUsed: new Date().toLocaleDateString("en-US", {
          timeZone: "Asia/Dhaka",
        }),
        url: data.data?.file[0]?.url?.startsWith("undefined")
          ? `${baseUrl}${data.data.file[0].url.replace("undefined", "")}`
          : data.data?.file[0]?.url,
        selected: true,
      };
      setResumes((prev) => [
        ...prev.map((r) => ({ ...r, selected: false })),
        newResume,
      ]);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload resume");
    },
  });

  // Apply job mutation
  const applyJobMutation = useMutation({
    mutationFn: async ({
      jobId,
      userId,
      resumeId,
      answer,
      hasValidVisa,
    }: {
      jobId: string;
      userId: string;
      resumeId?: string;
      answer: { question: string; ans: string }[];
      hasValidVisa?: boolean;
    }) => {
      if (!token || !baseUrl) throw new Error("Missing token or base URL");
      const body: any = { jobId, userId, answer };
      if (resumeId) body.resumeId = resumeId;
      if (typeof hasValidVisa === "boolean") body.hasValidVisa = hasValidVisa;

      const response = await fetch(`${baseUrl}/applied-jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to apply");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["job-applications", userId] });
      router.push("/alljobs");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      uploadResumeMutation.mutate(file);
    } else {
      toast.error("Please select a valid PDF file.");
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) =>
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionStatus === "loading") return;
    if (!userId) return toast.error("Please log in to apply.");
    if (!agreedToShareCV) return toast.error("Please agree to share your EVP.");

    const selectedResume = resumes.find((r) => r.selected);
    if (isResumeRequired && !selectedResume)
      return toast.error("Please upload/select a resume.");

    const customQuestions = jobData?.data.customQuestion || [];
    const missing = customQuestions.filter(
      (q) => !answers[q._id] || !answers[q._id].trim(),
    );
    if (missing.length > 0)
      return toast.error("Please answer all custom questions.");

    if (
      shouldAskVisaStatus &&
      isVisaRequired &&
      typeof hasValidVisa !== "boolean"
    )
      return toast.error(
        "Please confirm if you have a valid visa for this location.",
      );

    const answer = customQuestions.map((q) => ({
      question: q.question,
      ans: answers[q._id],
    }));

    applyJobMutation.mutate({
      jobId,
      userId,
      resumeId: selectedResume?.id,
      answer,
      hasValidVisa: shouldAskVisaStatus
        ? (hasValidVisa ?? undefined)
        : undefined,
    });
  };

  const userData: UserData = data?.data || {};
  const visaQuestionSection = shouldAskVisaStatus ? (
    <div className="space-y-3">
      <div>
        <Label className="block text-lg font-medium mb-3">
          {visaRequirementLabel}
          {isVisaRequired ? " *" : ""}
        </Label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="visa-status"
              value="yes"
              checked={hasValidVisa === true}
              onChange={() => setHasValidVisa(true)}
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="visa-status"
              value="no"
              checked={hasValidVisa === false}
              onChange={() => setHasValidVisa(false)}
            />
            <span>No</span>
          </label>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="container mx-auto px-4 sm:px-6">
      {/* Breadcrumb */}
      <div className="hidden md:block">
        <div className="flex items-center text-sm sm:text-base text-gray-500 my-6">
          <Link href="/alljobs" className="flex items-center text-black">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Jobs
          </Link>
          <span className="mx-2">{">"}</span>
          <Link href="/alljobs" className="hover:underline">
            All Jobs
          </Link>
          <span className="mx-2">{">"}</span>
          <Link href={`/alljobs/${jobId}`} className="hover:underline">
            Job Details
          </Link>
          <span className="mx-2">{">"}</span>
          <span>Job Application</span>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-4xl text-center font-bold mb-8">
        Job Application
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
        {/* Left column */}
        <div className="col-span-8 lg:col-span-2 flex flex-col items-center text-center">
          {isLoading || sessionStatus === "loading" ? (
            <div className="animate-pulse flex flex-col items-center space-y-3">
              <Skeleton className="h-[170px] w-[170px] rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <>
              <Image
                src={
                  userData.avatar?.url ||
                  "/placeholder.svg?height=170&width=170"
                }
                alt={userData.name || "User"}
                width={170}
                height={170}
                className="rounded object-cover w-[170px] h-[170px]"
              />
              <h2 className="text-xl sm:text-2xl font-semibold mt-3">
                {userData.name}
              </h2>
              {userData.role && (
                <p className="text-base sm:text-lg text-gray-600">
                  {userData.role.charAt(0).toUpperCase() +
                    userData.role.slice(1)}
                </p>
              )}
            </>
          )}
        </div>

        {/* Right column */}
        <div className="col-span-8 lg:col-span-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 border-b pb-4">
            Contact Info
          </h2>
          {isLoading || sessionStatus === "loading" ? (
            <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
              <div>
                <p className="text-lg font-semibold">Location</p>
                <p>{userData.address || "Not provided"}</p>
              </div>
              <div>
                <p className="text-lg font-semibold">Email</p>
                <p>{userData.email || "Not provided"}</p>
              </div>
              {userData.sLink?.find((l) => l.label === "LinkedIn") && (
                <div>
                  <p className="text-lg font-semibold">LinkedIn</p>
                  <Link
                    href={
                      userData.sLink?.find((l) => l.label === "LinkedIn")
                        ?.url || "#"
                    }
                    className="text-blue-600 hover:underline break-words"
                  >
                    {userData.sLink?.find((l) => l.label === "LinkedIn")?.url}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom Questions */}
      {!isJobLoading && (jobData?.data.customQuestion?.length ?? 0) > 0 && (
        <div className="my-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 border-b pb-2">
            Custom Questions
          </h2>
          <div className="space-y-6">
            {jobData?.data.customQuestion.map((question) => (
              <div key={question._id}>
                <Label className="block text-lg font-medium mb-2">
                  {question.question} *
                </Label>
                <Textarea
                  value={answers[question._id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(question._id, e.target.value)
                  }
                  placeholder="Enter your answer here"
                  className="w-full min-h-[100px]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resume Section */}
      {(isResumeRequired || isResumeOptional) && (
        <div className="my-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {visaQuestionSection}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 border-b pb-4">
              Resume {isResumeRequired ? "(Required)" : "(Optional)"}
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center bg-gray-50">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {uploadedFile
                  ? `Selected: ${uploadedFile.name}`
                  : "Drop or select your PDF resume"}
              </p>
              <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadResumeMutation.isPending}
              >
                {uploadResumeMutation.isPending
                  ? "Uploading..."
                  : "Choose File"}
              </Button>
            </div>

            {resumes.length > 0 && (
              <div>
                <Label className="block text-lg mb-2">Select Resume:</Label>
                <div className="space-y-2">
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="radio"
                        id={`resume-${resume.id}`}
                        name="selectedResume"
                        checked={resume.selected || false}
                        onChange={() =>
                          setResumes((prev) =>
                            prev.map((r) => ({
                              ...r,
                              selected: r.id === resume.id,
                            })),
                          )
                        }
                      />
                      <Label htmlFor={`resume-${resume.id}`}>
                        {resume.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2">
              <Checkbox
                id="agree-cv"
                checked={agreedToShareCV}
                onCheckedChange={(checked) => setAgreedToShareCV(!!checked)}
              />
              <Label
                htmlFor="agree-cv"
                className="text-sm sm:text-base text-gray-700"
              >
                I agree with my video pitch being shared with the recruiter
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-blue-700 py-5 sm:py-6 text-lg"
              disabled={
                applyJobMutation.isPending ||
                sessionStatus === "loading" ||
                uploadResumeMutation.isPending
              }
            >
              {applyJobMutation.isPending
                ? "Submitting..."
                : "Submit Application"}
            </Button>
          </form>
        </div>
      )}

      {/* If no resume section is needed at all */}
      {!isResumeRequired && !isResumeOptional && (
        <div className="my-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {visaQuestionSection}
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree-cv"
                  checked={agreedToShareCV}
                  onCheckedChange={(checked) => setAgreedToShareCV(!!checked)}
                />
                <Label htmlFor="agree-cv" className="text-sm text-gray-700">
                  I agree to my Elevator Video Pitch© being shared with the
                  Recruiter for the role I am applying for
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-blue-700 py-6 text-lg"
              disabled={
                applyJobMutation.isPending || sessionStatus === "loading"
              }
            >
              {applyJobMutation.isPending
                ? "Submitting..."
                : "Submit Application"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
