"use client";

import { useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import JobPreview from "./JobPreview";
import DOMPurify from "dompurify";
import { jobSchema, type JobFormData } from "@/types/job";
import StepIndicator from "./job-form-steps/step-indicator";
import JobDetailsStep from "./job-form-steps/job-details-step";
import JobDescriptionStep from "./job-form-steps/job-description-step";
import ApplicationRequirementsStep from "./job-form-steps/application-requirements-step";
import CustomQuestionsStep from "./job-form-steps/custom-questions-step";
import FinishStep from "./job-form-steps/finish-step";
import { useQueryClient } from "@tanstack/react-query";

interface JobCategory {
  _id: string;
  name: string;
  role: string[];
  categoryIcon: string;
}

interface Country {
  country: string;
  cities: string[];
}

interface JobCategoriesResponse {
  success: boolean;
  message: string;
  data: {
    category: JobCategory[];
  };
}

async function fetchJobCategories(retries = 2): Promise<JobCategoriesResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/category/job-category`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.data || !Array.isArray(data.data.category)) {
      throw new Error(data.message || "Invalid job categories response");
    }

    return {
      success: data.success,
      message: data.message || "Success",
      data: {
        category: data.data.category as JobCategory[],
      },
    };
  } catch (error) {
    console.error("[v0] Failed to fetch job categories:", error);
    if (retries > 0) {
      console.warn(
        `[v0] Retrying fetch job categories... (${retries} attempts left)`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchJobCategories(retries - 1);
    }
    throw error;
  }
}

async function postJob(data: any, retries = 2): Promise<any> {
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
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(
        `Failed to publish job: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }
    return await response.json();
  } catch (error) {
    console.error(" Job post error:", error);
    if (retries > 0) {
      console.warn(`Retrying job post... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return postJob(data, retries - 1);
    }
    throw error;
  }
}

export default function MultiStepJobForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategoryRoles, setSelectedCategoryRoles] = useState<string[]>(
    []
  );
  const [jobCategories, setJobCategories] = useState<JobCategoriesResponse>({
    success: false,
    message: "",
    data: { category: [] },
  });
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobTitle: "",
      country: "",
      region: "",
      vacancy: 1,
      employement_Type: undefined,
      experience: undefined,
      locationType: undefined,
      careerStage: undefined,
      categoryId: "",
      role: "",
      compensation: undefined,
      expirationDate: "30",
      companyUrl: "",
      jobDescription: "",
      publishDate: new Date().toISOString(),
      // NEW shape: requirement/status
      applicationRequirements: [
        { requirement: "Resume", status: "" },
        { requirement: "Have you got a valid visa for this location?", status: "" },
      ],
      customQuestions: [{ id: "1", question: "" }],
      userId,
    },
  });

  useEffect(() => {
    const loadJobCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const data = await fetchJobCategories();
        setJobCategories(data);
      } catch (error) {
        setCategoriesError(
          error instanceof Error ? error.message : "Failed to load categories"
        );
        toast.error("Failed to load job categories");
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadJobCategories();
  }, []);

  useEffect(() => {
    const loadCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/countries`
        );
        const data = await response.json();
        if (data.error) throw new Error("Failed to fetch countries");
        setCountries(data.data as Country[]);
      } catch (error) {
        console.error("Error loading countries:", error);
        toast.error("Failed to load countries");
      } finally {
        setIsLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      if (!selectedCountry) {
        setCities([]);
        return;
      }
      setIsLoadingCities(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/countries/cities`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: selectedCountry }),
          }
        );
        const data = await response.json();
        if (data.error) throw new Error("Failed to fetch cities");
        setCities(data.data as string[]);
      } catch (error) {
        console.error("Error loading cities:", error);
        toast.error("Failed to load cities");
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };
    loadCities();
  }, [selectedCountry]);

  useEffect(() => {
    if (countries.length > 0 && !form.getValues("country")) {
      const defaultCountry = countries[0].country;
      form.setValue("country", defaultCountry);
      setSelectedCountry(defaultCountry);
    }
  }, [countries, form]);

  const stepFields: Record<number, (keyof JobFormData)[]> = {
    1: [
      "jobTitle",
      "country",
      "region",
      "vacancy",
      "employement_Type",
      "experience",
      "locationType",
      "careerStage",
      "categoryId",
      "role",
      "expirationDate",
      "companyUrl",
    ],
    2: ["jobDescription"],
    3: [],
    4: [],
    5: [],
  };

  const handleStepClick = async (targetStep: number) => {
    if (targetStep <= currentStep) {
      setCurrentStep(targetStep);
      return;
    }

    let canNavigate = true;
    for (let step = currentStep; step < targetStep; step++) {
      const fieldsToValidate = stepFields[step];
      if (fieldsToValidate && fieldsToValidate.length > 0) {
        const isValid = await form.trigger(fieldsToValidate);
        if (!isValid) {
          const errors = form.formState.errors;
          const firstError = Object.values(errors)[0];
          toast.error(
            firstError?.message ||
              `Please complete step ${step} before proceeding.`
          );
          canNavigate = false;
          break;
        }
      }
    }

    if (canNavigate) {
      setCurrentStep(targetStep);
    }
  };

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep];
    if (fieldsToValidate && fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      if (isValid) {
        setCurrentStep((prev) => Math.min(prev + 1, 5));
      } else {
        const errors = form.formState.errors;
        const firstError = Object.values(errors)[0];
        toast.error(
          firstError?.message || "Please fill in all required fields."
        );
      }
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleCancel = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handlePreviewClick = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setShowPreview(true);
    } else {
      setShowPreview(true); // Show preview for debugging
    }
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const handlePublish = async (data: JobFormData) => {
    if (!session?.user?.id) {
      toast.error("User not authenticated. Please log in.");
      return;
    }

    setIsPending(true);
    try {
      const responsibilities = data.jobDescription
        .split("\n")
        .filter((line) => line.startsWith("* "))
        .map((line) => DOMPurify.sanitize(line.substring(2)))
        .filter((line) => line);

      const requirements = data.jobDescription
        .split("\n")
        .filter((line) => line.startsWith("- "))
        .map((line) => DOMPurify.sanitize(line.substring(2)))
        .filter((line) => line);

      const getPublishDate = () => {
        if (publishNow) return new Date().toISOString();
        return selectedDate?.toISOString() || new Date().toISOString();
      };

      const expirationDateDays = data.expirationDate || "30";

      const getExpirationDate = (publishDate: string) => {
        const days = Number.parseInt(expirationDateDays) || 30;
        const expDate = new Date(publishDate);
        expDate.setDate(expDate.getDate() + days);
        return expDate.toISOString();
      };

      const publishDate = getPublishDate();
      const expiryDateISO = getExpirationDate(publishDate);

      const selectedCategory = jobCategories.data.category.find(
        (cat) => cat._id === data.categoryId
      );

      const postData = {
        userId: data.userId || userId,
        title: DOMPurify.sanitize(data.jobTitle),
        description: DOMPurify.sanitize(data.jobDescription),
        salaryRange: data.compensation ? String(data.compensation) : "$0 - $0",
        location: DOMPurify.sanitize(`${data.country}, ${data.region}`),
        shift: data.employement_Type === "full-time" ? "Day" : "Flexible",
        responsibilities,
        educationExperience: requirements,
        benefits: [],
        vacancy: data.vacancy,
        experience: data.experience || "Not Specified",
        deadline: expiryDateISO,
        expiryDate: expiryDateISO,
        expirationDate: expirationDateDays,
        status: "active" as const,
        jobCategoryId: data.categoryId,
        name: selectedCategory?.name || "",
        role: DOMPurify.sanitize(data.role),
        compensation: data.compensation ? "Monthly" : "Negotiable",
        archivedJob: false,
        applicationRequirement:
          data.applicationRequirements
            ?.filter((req) => req.status && req.status.trim() !== "")
            .map((req) => ({
              requirement: DOMPurify.sanitize(req.requirement),
              status: DOMPurify.sanitize(req.status || ""),
            })) || [],
        customQuestion:
          data.customQuestions
            ?.filter((q) => q.question)
            .map((q) => ({ question: DOMPurify.sanitize(q.question!) })) || [],
        employement_Type: data.employement_Type,
        website_Url: data.companyUrl
          ? DOMPurify.sanitize(data.companyUrl)
          : undefined,
        publishDate, // ← stored once here
        career_Stage: data.careerStage,
        location_Type: data.locationType,
      };

      await postJob(postData);
      // console.log(postData);
      toast.success("Job published successfully!");
      if (role === "company") {
        window.location.href = "/elevator-video-pitch";
      } else if (role === "recruiter") {
        window.location.href = "/recruiter-dashboard";
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to publish job"
      );
    } finally {
      setIsPending(false);
    }
  };

  const steps = [
    { number: 1, title: "Job Details", active: currentStep >= 1 },
    { number: 2, title: "Job Description", active: currentStep >= 2 },
    { number: 3, title: "Application Requirements", active: currentStep >= 3 },
    { number: 4, title: "Custom Questions", active: currentStep >= 4 },
    { number: 5, title: "Finish", active: currentStep >= 5 },
  ];

  if (showPreview) {
    const formData = form.getValues();
    const safeCompanyUrl = formData.companyUrl || "";
    const selectedCategory = jobCategories.data.category.find(
      (cat) => cat._id === formData.categoryId
    );
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Job Preview
            </h1>
            <p className="text-gray-600">
              Review your job posting before publishing
            </p>
          </div>
          <form onSubmit={form.handleSubmit(handlePublish)}>
            <JobPreview
              formData={{
                ...formData,
                category: selectedCategory?.name ?? "",
                compensation:
                  formData.compensation !== undefined
                    ? String(formData.compensation)
                    : undefined,
              }}
              companyUrl={safeCompanyUrl}
              applicationRequirements={(formData.applicationRequirements ?? []).map((req, index) => ({
                id: String(index),
                requirement: req.requirement,
                status: req.status ?? "",
                label: req.requirement,
                required: req.status?.trim() !== "",
              }))}
              customQuestions={(formData.customQuestions ?? []).map((q) => ({
                id: q.id,
                question: q.question ?? "",
              }))}
              selectedDate={selectedDate ?? new Date()}
              publishNow={publishNow}
              onBackToEdit={handleBackToEdit}
            />
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#131313] text-center mb-8">
          Create Job Posting
        </h1>
        {categoriesError && (
          <div className="text-red-600 mb-4 text-center">
            {categoriesError}
            <Button
              variant="outline"
              onClick={() => {
                setCategoriesError(null);
                setCategoriesLoading(true);
                fetchJobCategories()
                  .then((data) => setJobCategories(data))
                  .catch((error) =>
                    setCategoriesError(
                      error instanceof Error
                        ? error.message
                        : "Failed to load categories"
                    )
                  )
                  .finally(() => setCategoriesLoading(false));
              }}
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handlePublish)}
            className="space-y-6"
          >
            <StepIndicator
              steps={steps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
            {currentStep === 1 && (
              <JobDetailsStep
                form={form}
                onNext={handleNext}
                onCancel={handleCancel}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                selectedCategoryRoles={selectedCategoryRoles}
                setSelectedCategoryRoles={setSelectedCategoryRoles}
                jobCategories={jobCategories}
                categoriesLoading={categoriesLoading}
                categoriesError={categoriesError}
                countries={countries}
                isLoadingCountries={isLoadingCountries}
                cities={cities}
                isLoadingCities={isLoadingCities}
              />
            )}
            {currentStep === 2 && (
              <JobDescriptionStep
                form={form}
                onNext={handleNext}
                onCancel={handleCancel}
                publishNow={publishNow}
                setPublishNow={setPublishNow}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            )}
            {currentStep === 3 && (
              <ApplicationRequirementsStep
                form={form}
                onNext={handleNext}
                onCancel={handleCancel}
              />
            )}
            {currentStep === 4 && (
              <CustomQuestionsStep
                form={form}
                onNext={handleNext}
                onCancel={handleCancel}
              />
            )}
            {currentStep === 5 && (
              <FinishStep
                form={form}
                onPreview={handlePreviewClick}
                onPublish={form.handleSubmit(handlePublish)}
                isPending={isPending}
              />
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
