"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import JobDetailsPreviewEdit from "@/components/job-preview-sections/job-details-preview-edit";
import CustomCalendar from "@/components/CustomCalendar";
import { Switch } from "@/components/ui/switch";
import DOMPurify from "dompurify";

interface Country {
  country: string;
  cities: string[];
}

interface JobCategory {
  _id: string;
  name: string;
  role: string[];
  categoryIcon: string;
}

interface CurrencyApiItem {
  _id: string;
  code: string;
  currencyName: string;
  symbol?: string;
}

interface ApplicationRequirement {
  id: string;
  requirement: string;
  status: string;
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
  companyUrl: string;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  vacancy: number;
  experience: string;
  deadline: string;
  publishDate: string;
  expiryDate?: string;
  expirationDate?: string;
  status: string;
  jobCategoryId: string;
  employement_Type: string;
  compensation: string;
  arcrivedJob: boolean;
  applicationRequirement: { requirement: string; status: string }[];
  customQuestion: { question: string }[];
  career_Stage: string;
  location_Type: string;
}

// STATIC APPLICATION REQUIREMENTS
const STATIC_REQUIREMENTS = [
  { id: "resume", label: "Resume" },
  { id: "visa", label: "Have you got a valid visa for this location?" },
];

// keep this OUTSIDE the component
async function updateJob(id: string, data: JobPostData, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/update/${id}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let errorMessage = `Failed to update job: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.message) errorMessage += ` - ${errorData.message}`;
    } catch (_) {}
    throw new Error(errorMessage);
  }

  return response.json();
}

async function fetchJobCategories() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/category/job-category`);
  if (!response.ok) throw new Error("Failed to fetch categories");
  const data = await response.json();
  return data.data.category as JobCategory[];
}

async function fetchCountries() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/countries`);
  const data = await response.json();
  if (data.error) throw new Error("Failed to fetch countries");
  return data.data as Country[];
}

async function fetchCities(country: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/countries/cities`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    }
  );
  const data = await response.json();
  if (data.error) throw new Error("Failed to fetch cities");
  return data.data as string[];
}

async function fetchCurrencies() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/courency`);
  if (!response.ok) throw new Error("Failed to fetch currencies");
  const data = await response.json();
  return (Array.isArray(data.data) ? data.data : []) as CurrencyApiItem[];
}

export default function JobPreview() {
  const session = useSession();
  const userId = session.data?.user?.id;
  const role = session.data?.user?.role;
  const router = useRouter();
  const params = useParams();
  const token = session.data?.accessToken;
  const id = (params?.id as string) || "6896fb2b12980e468298ad0f";

  const [isEditing, setIsEditing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [publishNow, setPublishNow] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    country: "",
    region: "",
    employmentType: "",
    experience: "",
    category: "",
    categoryId: "",
    role: "",
    compensationCurrency: "",
    compensation: "",
    expirationDate: "",
    jobDescription: "",
    publishDate: "",
    companyUrl: "",
    vacancy: 1,
    locationType: "",
    careerStage: "",
  });

  // Static application requirements state (Resume + Visa)
  const [applicationRequirements, setApplicationRequirements] = useState<
    ApplicationRequirement[]
  >(() =>
    STATIC_REQUIREMENTS.map((r) => ({
      id: r.id,
      requirement: r.label,
      status: "",
    }))
  );

  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  // react-query
  const { data: jobData, isLoading: jobLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${id}`
      );
      if (!response.ok) throw new Error("Failed to fetch job");
      const res = await response.json();
      return res.data;
    },
  });

  const { data: jobCategories = [] } = useQuery({
    queryKey: ["jobCategories"],
    queryFn: fetchJobCategories,
  });
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });
  const { data: cities = [] } = useQuery({
    queryKey: ["cities", selectedCountry],
    queryFn: () =>
      selectedCountry ? fetchCities(selectedCountry) : Promise.resolve([]),
    enabled: !!selectedCountry,
  });
  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: fetchCurrencies,
  });

  // --- LOOP FIX: split initialization into two effects and guard with refs ---
  const initializedFromJobRef = useRef(false);

  // util inside file
  const deriveExpirationDays = (job: any) => {
    const expirySource = job?.expiryDate || job?.deadline;
    const publishBase = job?.publishDate || job?.createdAt;
    if (!expirySource || !publishBase) return "";
    const expiry = new Date(expirySource);
    const base = new Date(publishBase);
    if (Number.isNaN(expiry.getTime()) || Number.isNaN(base.getTime())) {
      return "";
    }
    const diffMs = expiry.getTime() - base.getTime();
    const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    return diffDays.toString();
  };

  // 1) Initialize from jobData ONCE
  useEffect(() => {
    if (!jobData || initializedFromJobRef.current) return;

    const createdAt = jobData.createdAt
      ? new Date(jobData.createdAt)
      : undefined;
    const [country, region] = jobData.location?.split(", ") || ["", ""];

    setFormData((prev) => ({
      ...prev,
      jobTitle: jobData.title || "",
      department: jobData.department || "",
      country: country || "",
      region: region || "",
      employmentType: jobData.employement_Type || "",
      experience: jobData.experience || "",
      categoryId: jobData.jobCategoryId || "",
      compensationCurrency: jobData.compensationCurrency || "",
      compensation: jobData.salaryRange?.replace(/[^\d]/g, "") || "",
      expirationDate: deriveExpirationDays(jobData) || "",
      jobDescription: jobData.description || "",
      publishDate: createdAt ? createdAt.toLocaleDateString() : "",
      companyUrl: jobData.website_Url || "",
      vacancy: jobData.vacancy || 1,
      locationType: jobData.location_Type || "",
      careerStage: jobData.career_Stage || "",
    }));

    // Initialize static application requirements from job data statuses
    setApplicationRequirements(
      STATIC_REQUIREMENTS.map((r, idx) => {
        const existing =
          jobData.applicationRequirement?.find(
            (req: any) => req.requirement === r.label
          ) ?? jobData.applicationRequirement?.[idx];

        return {
          id: r.id,
          requirement: r.label,
          status: existing?.status || "",
        };
      })
    );

    setCustomQuestions(
      jobData.customQuestion?.map((q: any, idx: number) => ({
        id: q._id || `q-${idx}`,
        question: q.question || "",
      })) || []
    );

    if (country) setSelectedCountry(country);
    if (jobData.publishDate) {
      const publishDt = new Date(jobData.publishDate);
      const now = new Date();
      if (publishDt > now) {
        setPublishNow(false);
        setSelectedDate(publishDt);
      } else {
        setPublishNow(true);
        setSelectedDate(new Date(jobData.updatedAt || jobData.publishDate));
      }
    } else {
      setPublishNow(true);
      setSelectedDate(new Date(jobData.updatedAt || Date.now()));
    }

    initializedFromJobRef.current = true;
  }, [jobData]);

  // 2) After categories load, fill category name & role ONLY if values differ
  useEffect(() => {
    if (!jobData || !jobCategories.length) return;
    const found = jobCategories.find((c) => c._id === jobData.jobCategoryId);
    if (!found) return;

    setFormData((prev) => {
      const nextCategory = found.name || "";
      const nextRole = found.role?.[0] || "";
      if (prev.category === nextCategory && prev.role === nextRole) return prev;
      return { ...prev, category: nextCategory, role: nextRole };
    });
  }, [jobData, jobCategories]);

  const { mutate: updateJobMutation, isPending } = useMutation({
    mutationFn: (data: JobPostData) => updateJob(id, data, token),
    onSuccess: () => {
      toast.success(
        "Job updated successfully! Admin will review and publish it soon."
      );
      setIsEditing(false);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update job");
    },
  });

  function computeDeadline(publishAt: string | Date, daysStr: string): string {
    const days = Number.parseInt(daysStr || "", 10);
    const safeDays = Number.isFinite(days) && days > 0 ? days : 30; // default 30

    const base = new Date(publishAt);
    if (Number.isNaN(base.getTime())) {
      // fallback to now if publishAt is invalid
      const now = new Date();
      now.setDate(now.getDate() + safeDays);
      return now.toISOString();
    }

    base.setDate(base.getDate() + safeDays);
    return base.toISOString();
  }

  const handleFieldChange = useCallback(
    (field: string, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleUpdateRequirement = useCallback(
    (id: string, field: string, value: string) => {
      if (field !== "status") return;
      setApplicationRequirements((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: value } : req
        )
      );
    },
    []
  );

  const handleAddQuestion = useCallback(() => {
    setCustomQuestions((prev) => [
      ...prev,
      { id: `q-${Date.now()}`, question: "" },
    ]);
  }, []);

  const handleUpdateQuestion = useCallback((id: string, question: string) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question } : q))
    );
  }, []);

  const handleRemoveQuestion = useCallback((id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const handlePublishToggle = useCallback(
    (checked: boolean) => {
      setPublishNow(checked);
      if (checked) {
        const fallback =
          jobData?.updatedAt ||
          jobData?.publishDate ||
          new Date().toISOString();
        setSelectedDate(new Date(fallback));
      }
    },
    [jobData]
  );

  const handleSave = useCallback(() => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }
    if (!token) {
      toast.error("Missing access token. Please sign in again.");
      return;
    }

    const publishAtISO = publishNow
      ? new Date(jobData?.updatedAt || Date.now()).toISOString()
      : selectedDate?.toISOString() ?? new Date().toISOString();

    // turn “expiration days” into a real deadline date
    const deadlineISO = computeDeadline(
      publishAtISO,
      String(formData.expirationDate || "")
    );

    const postData: JobPostData = {
      userId,
      companyId: jobData?.companyId || "",
      title: formData.jobTitle,
      description: formData.jobDescription,
      salaryRange: formData.compensation
        ? `${formData.compensationCurrency} ${formData.compensation}`
        : "Negotiable",
      location: `${formData.country}, ${formData.region}`,
      shift: formData.employmentType === "full-time" ? "Day" : "Flexible",
      companyUrl: formData.companyUrl,
      responsibilities: [],
      educationExperience: [],
      benefits: [],
      vacancy: formData.vacancy,
      experience: formData.experience,
      deadline: deadlineISO,
      expiryDate: deadlineISO,
      expirationDate: String(formData.expirationDate || ""),
      publishDate: publishAtISO,
      status: jobData?.status || "active",
      jobCategoryId: formData.categoryId,
      employement_Type: formData.employmentType,
      compensation: formData.compensationCurrency || "Negotiable",
      arcrivedJob: jobData?.arcrivedJob || false,
      applicationRequirement: applicationRequirements.map((req) => ({
        requirement: req.requirement,
        status: req.status,
      })),
      customQuestion: customQuestions.map((q) => ({ question: q.question })),
      career_Stage: formData.careerStage,
      location_Type: formData.locationType,
    };

    updateJobMutation(postData);
  }, [
    userId,
    jobData?.companyId,
    jobData?.status,
    jobData?.arcrivedJob,
    jobData?.updatedAt,
    jobData?.publishDate,
    formData,
    publishNow,
    selectedDate,
    applicationRequirements,
    customQuestions,
    updateJobMutation,
    token,
  ]);

  const descriptionCharCount = formData.jobDescription.length;
  const descriptionWordCount = formData.jobDescription
    .replace(/<[^>]+>/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  if (jobLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Job not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href={
                role === "company"
                  ? `/manage-jobs/${
                      jobData.companyId?._id || jobData.companyId
                    }`
                  : "/recruiter-dashboard"
              }
            >
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isEditing ? "Edit Job Posting" : "Job Preview"}
            </h1>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          )}
        </div>

        {/* Job Title */}
        <Card className="border-none shadow-md bg-gradient-to-r from-[#2B7FD0]/10 to-transparent">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {formData.jobTitle}
            </h2>
            <div className="flex flex-wrap gap-3">
              {formData.category && (
                <span className="px-3 py-1 bg-[#2B7FD0] text-white rounded-full text-sm">
                  {formData.category}
                </span>
              )}
              {formData.role && (
                <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                  {formData.role}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card className="shadow-md border-none">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Job Details
            </h2>
            {isEditing ? (
              <JobDetailsPreviewEdit
                formData={formData}
                onFieldChange={handleFieldChange}
                jobCategories={jobCategories}
                countries={countries}
                cities={cities}
                currencies={currencies}
                selectedCountry={selectedCountry}
                onCountryChange={setSelectedCountry}
                isLoadingCountries={false}
                isLoadingCities={false}
                isLoadingCurrencies={false}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Job Title", value: formData.jobTitle },
                  { label: "Department", value: formData.department },
                  { label: "Category", value: formData.category },
                  { label: "Role", value: formData.role },
                  { label: "Country", value: formData.country },
                  { label: "City", value: formData.region },
                  { label: "Employment Type", value: formData.employmentType },
                  { label: "Experience Level", value: formData.experience },
                  { label: "Location Type", value: formData.locationType },
                  { label: "Career Stage", value: formData.careerStage },
                  { label: "Vacancies", value: formData.vacancy },
                  {
                    label: "Compensation",
                    value: formData.compensation
                      ? `${formData.compensationCurrency} ${formData.compensation}`
                      : "N/A",
                  },
                  {
                    label: "Expiration (Days)",
                    value: formData.expirationDate,
                  },
                  { label: "Company Website", value: formData.companyUrl },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {item.label}
                    </p>
                    <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                      {item.value || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card className="shadow-md border-none">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Job Description
              </h2>
              {!isEditing && (
                <div className="text-sm text-gray-600 mt-2 sm:mt-0 text-right">
                  <p>Characters: {descriptionCharCount}/2000</p>
                  <p>Words: {descriptionWordCount}/20 min</p>
                </div>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <TextEditor
                  value={formData.jobDescription}
                  onChange={(value) =>
                    handleFieldChange("jobDescription", value)
                  }
                />
                <p className="text-sm text-gray-600">
                  Characters: {descriptionCharCount}/2000 | Words:{" "}
                  {descriptionWordCount}/20 min
                </p>
              </div>
            ) : (
              <div
                className="p-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(formData.jobDescription),
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Application Requirements, Custom Questions, Publish Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Requirements */}
          <Card className="border-none shadow-md col-span-1">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Application Requirements
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                What personal info would you like to gather about each
                applicant?
              </p>
              <div className="space-y-4">
                {applicationRequirements.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-4 border border-gray-200 rounded-lg px-4 py-3 bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2B7FD0] text-white">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {req.requirement}
                      </span>
                    </div>

                    {isEditing ? (
                      <select
                        value={req.status}
                        onChange={(e) =>
                          handleUpdateRequirement(
                            req.id,
                            "status",
                            e.target.value
                          )
                        }
                        className="w-40 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700"
                      >
                        <option value="">Set status</option>
                        <option value="Required">Required</option>
                        <option value="Optional">Optional</option>
                      </select>
                    ) : (
                      <div className="text-sm">
                        {req.status === "Required" ? (
                          <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 font-semibold">
                            Required
                          </span>
                        ) : req.status === "Optional" ? (
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold">
                            Optional
                          </span>
                        ) : (
                          <span className="text-gray-500">Not set</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Questions */}
          <Card className="border-none shadow-md col-span-1">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Custom Questions
              </h2>
              <div className="space-y-4">
                {customQuestions.length === 0 && !isEditing && (
                  <div className="p-3 border border-dashed border-gray-300 rounded-lg text-gray-500">
                    No custom questions added.
                  </div>
                )}
                {customQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-col sm:flex-row sm:items-end gap-3"
                  >
                    {isEditing ? (
                      <>
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700">
                            Question
                          </label>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, e.target.value)
                            }
                            className="w-full h-11 px-3 border border-gray-300 rounded-lg"
                            placeholder="Enter question"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveQuestion(q.id)}
                        >
                          Remove
                        </Button>
                      </>
                    ) : (
                      <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
                        {q.question || "—"}
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <Button
                    onClick={handleAddQuestion}
                    className="mt-2 bg-[#2B7FD0]"
                  >
                    Add Question
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publish Schedule */}
          <Card className="border-none shadow-md col-span-1">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Publish Now
                </h2>
                <Switch
                  checked={publishNow}
                  onCheckedChange={handlePublishToggle}
                  className="data-[state=checked]:bg-[#2B7FD0]"
                />
              </div>
              {!publishNow && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-base font-semibold mb-4">
                    Schedule Publish
                  </h3>
                  <CustomCalendar
                    selectedDate={selectedDate || undefined}
                    onDateSelect={setSelectedDate}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                className="border-[#2B7FD0] text-[#2B7FD0]"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/90"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/90" disabled>
              Published
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
