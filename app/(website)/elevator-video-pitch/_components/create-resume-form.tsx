"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BannerUpload } from "@/components/shared/banner-upload";
import { ElevatorPitchUpload } from "./elevator-pitch-upload";
import { SkillsSelector } from "./skills-selector";
import { PersonalInfoSection } from "./resume/personal-info-section";
import { ExperienceSection } from "./resume/experience-section";
import { EducationSection } from "./resume/education-section";
import { LanguageSection } from "./resume/language-section";
import { AwardsSection } from "./resume/awards-section";
import { CertificationsSection } from "./resume/certifications-section";
import {
  uploadElevatorPitch,
  deleteElevatorPitchVideo,
  createResume,
} from "@/lib/api-service";
import { useSession } from "next-auth/react";

const MAX_URL_LEN = 2048;

export const resumeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name can be at most 50 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name can be at most 50 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(254, "Email can be at most 254 characters"),
  title: z
    .string()
    .trim()
    .max(100, "Title can be at most 100 characters")
    .optional(),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(100, "City can be at most 100 characters"),
  zip: z.string().trim().max(20, "ZIP can be at most 20 characters").optional(),
  country: z
    .string()
    .trim()
    .min(1, "Country is required")
    .max(100, "Country can be at most 100 characters"),
  aboutUs: z
    .string()
    .trim()
    .min(1, "About section is required")
    .refine(
      (value) => {
        const wordCount = value.trim().split(/\s+/).length;
        return wordCount <= 200;
      },
      { message: "About section cannot exceed 200 words" }
    ),
  skills: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(50, "Each skill can be at most 50 characters")
    )
    .min(1, "At least one skill is required")
    .max(30, "You can list at most 30 skills"),
  sLink: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .min(1, "Platform name is required")
          .max(50, "Platform name can be at most 50 characters"),
        url: z
          .string()
          .trim()
          .url("Invalid URL format")
          .max(MAX_URL_LEN, `URL can be at most ${MAX_URL_LEN} characters`)
          .or(z.string().length(0)),
      })
    )
    .max(20, "You can add at most 20 social links")
    .optional(),
  experiences: z
    .array(
      z
        .object({
          company: z
            .string()
            .trim()
            .max(100, "Company can be at most 100 characters")
            .optional(),
          position: z
            .string()
            .trim()
            .max(100, "Position can be at most 100 characters")
            .optional(),
          duration: z
            .string()
            .trim()
            .max(50, "Duration can be at most 50 characters")
            .optional(),
          startDate: z
            .string()
            .trim()
            .max(30, "Start date can be at most 30 characters")
            .optional(),
          endDate: z
            .string()
            .trim()
            .max(30, "End date can be at most 30 characters")
            .optional(),
          country: z
            .string()
            .trim()
            .max(100, "Country can be at most 100 characters")
            .optional(),
          city: z
            .string()
            .trim()
            .max(100, "City can be at most 100 characters")
            .optional(),
          zip: z
            .string()
            .trim()
            .max(20, "ZIP can be at most 20 characters")
            .optional(),
          jobDescription: z
            .string()
            .trim()
            .max(2000, "Job description can be at most 2000 characters")
            .optional(),
          jobCategory: z
            .string()
            .trim()
            .max(50, "Job category can be at most 50 characters")
            .optional(),
          currentlyWorking: z.boolean().optional().default(false),
        })
        .refine(
          (data) =>
            !data.company ||
            !data.position ||
            data.currentlyWorking ||
            (!data.currentlyWorking && !!data.endDate),
          {
            message: "End date is required unless Current Position is checked",
            path: ["endDate"],
          }
        )
    )
    .max(20, "You can add at most 20 experiences")
    .optional(),
  educationList: z
    .array(
      z
        .object({
          instituteName: z
            .string()
            .trim()
            .max(150, "Institution name can be at most 150 characters")
            .optional(),
          degree: z
            .string()
            .trim()
            .max(100, "Degree can be at most 100 characters")
            .optional(),
          fieldOfStudy: z
            .string()
            .trim()
            .max(100, "Field of study can be at most 100 characters")
            .optional(),
          startDate: z
            .string()
            .trim()
            .max(30, "Start date can be at most 30 characters")
            .optional(),
          graduationDate: z
            .string()
            .trim()
            .max(30, "Graduation date can be at most 30 characters")
            .optional(),
          currentlyStudying: z.boolean().optional().default(false),
          city: z
            .string()
            .trim()
            .max(100, "City can be at most 100 characters")
            .optional(),
          country: z
            .string()
            .trim()
            .max(100, "Country can be at most 100 characters")
            .optional(),
        })
        .refine(
          (data) =>
            !(
              data.instituteName &&
              data.startDate &&
              !data.currentlyStudying &&
              !data.graduationDate
            ),
          {
            message: "Graduation date is required unless currently studying",
            path: ["graduationDate"],
          }
        )
    )
    .max(20, "You can add at most 20 education entries")
    .optional(),
  awardsAndHonors: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .max(150, "Title can be at most 150 characters")
          .optional(),
        programName: z
          .string()
          .trim()
          .max(150, "Program name can be at most 150 characters")
          .optional(),
        programeDate: z
          .string()
          .trim()
          .max(30, "Date can be at most 30 characters")
          .optional(),
        description: z
          .string()
          .trim()
          .max(1000, "Description can be at most 1000 characters")
          .optional(),
      })
    )
    .max(20, "You can add at most 20 awards")
    .optional(),
  certifications: z
    .array(
      z
        .string()
        .trim()
        .max(100, "Each certification can be at most 100 characters")
    )
    .max(50, "You can add at most 50 certifications")
    .optional(),
  languages: z
    .array(
      z.string().trim().max(50, "Each language can be at most 50 characters")
    )
    .max(20, "You can add at most 20 languages")
    .optional(),
  immediatelyAvailable: z.boolean().optional().default(false),
});

type ResumeFormData = z.infer<typeof resumeSchema>;

export default function CreateResumeForm() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [isElevatorPitchUploaded, setIsElevatorPitchUploaded] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { data: session } = useSession();

  const form = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      title: "",
      city: "",
      zip: "",
      country: "",
      aboutUs: "",
      skills: [],
      sLink: [],
      experiences: [],
      educationList: [
        {
          instituteName: "",
          degree: "",
          fieldOfStudy: "",
          startDate: "",
          graduationDate: "",
          currentlyStudying: false,
          city: "",
          country: "",
        },
      ],
      awardsAndHonors: [],
      certifications: [],
      languages: [],
      immediatelyAvailable: false,
    },
  });

  useEffect(() => {
    form.setValue("skills", selectedSkills);
  }, [selectedSkills, form]);

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control: form.control,
    name: "experiences",
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control: form.control,
    name: "educationList",
  });

  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAward,
  } = useFieldArray({
    control: form.control,
    name: "awardsAndHonors",
  });

  const createResumeMutation = useMutation({
    mutationFn: createResume,
    onSuccess: (data: any) => {
      toast.success(data?.message || "Resume created successfully!");
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to create resume. Please try again."
      );
      console.error("Error creating resume:", error);
    },
  });

  const uploadElevatorPitchMutation = useMutation({
    mutationFn: uploadElevatorPitch,
    onSuccess: (data) => {
      setIsElevatorPitchUploaded(true);
      setUploadedVideoUrl(data.videoUrl);
      toast.success(
        "Upload completed! We’re processing your video—check back shortly."
      );
    },
    onError: (error) => {
      console.error("Upload error:", error);
      const errorMessage =
        (typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as any).response?.data?.message) ||
        error.message ||
        "Upload failed";
      toast.error(errorMessage);
    },
  });

  const deleteElevatorPitchMutation = useMutation({
    mutationFn: deleteElevatorPitchVideo,
    onSuccess: () => {
      setIsElevatorPitchUploaded(false);
      setUploadedVideoUrl(null);
      setElevatorPitchFile(null);
    },
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });

  const handlePhotoUpload = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast.error("Failed to read the photo. Please try another image.");
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleBannerUpload = (file: File | null) => {
    setBannerFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setBannerPreview(null);
    }
  };

  const handleElevatorPitchUpload = async () => {
    if (!elevatorPitchFile || !session?.user?.id) {
      toast.error("Please select a video file first");
      return;
    }
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      try {
        await deleteElevatorPitchMutation.mutateAsync(session.user.id);
      } catch (_) {
        // swallow — we don't care if there's nothing to delete
      }
      await uploadElevatorPitchMutation.mutateAsync({
        videoFile: elevatorPitchFile,
        userId: session.user.id,
      });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleElevatorPitchDelete = async () => {
    if (!session?.user?.id) return;
    deleteElevatorPitchMutation.mutate(session.user.id);
  };

  const onSubmit = async (data: z.infer<typeof resumeSchema>) => {
    if (!isElevatorPitchUploaded) {
      toast.error("Please upload an elevator pitch video before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);

      const formatDateToISO = (dateString: string) => {
        if (!dateString) return "";
        const [month, year] = dateString.split("/");
        if (month && year && month.length === 2 && year.length === 4) {
          return new Date(`${year}-${month}-01T00:00:00.000Z`).toISOString();
        }
        return "";
      };

      const processedExperiences = data.experiences?.map((exp) => ({
        ...exp,
        startDate: formatDateToISO(exp.startDate || ""),
        endDate: exp.currentlyWorking ? "" : formatDateToISO(exp.endDate || ""),
      }));

      const processedEducation = data.educationList?.map((edu) => ({
        ...edu,
        startDate: formatDateToISO(edu.startDate || ""),
        graduationDate: edu.currentlyStudying
          ? ""
          : formatDateToISO(edu.graduationDate || ""),
      }));

      const processedAwards = data.awardsAndHonors?.map((award) => ({
        ...award,
        programeDate: formatDateToISO(award.programeDate || ""),
      }));

      const formData = new FormData();

      const resumeData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        title: data.title,
        city: data.city,
        zip: data.zip,
        country: data.country,
        aboutUs: data.aboutUs,
        skills: data.skills,
        sLink: data.sLink?.filter((link) => link.label && link.url),
        certifications: data.certifications,
        languages: data.languages,
        immediatelyAvailable: data.immediatelyAvailable,
      };

      formData.append("resume", JSON.stringify(resumeData));
      formData.append("experiences", JSON.stringify(processedExperiences));
      formData.append("educationList", JSON.stringify(processedEducation));
      formData.append("awardsAndHonors", JSON.stringify(processedAwards));
      formData.append("userId", session?.user?.id as string);

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      if (bannerFile) {
        formData.append("banner", bannerFile);
      }

      createResumeMutation.mutate(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    const firstError = Object.values(errors)[0] as { message?: string };
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      toast.error("Please check the form and fix the errors.");
    }
  };

  useEffect(() => {
    if (!session?.user) return;
    if (form.formState.isDirty) return;

    const customUser = session.user as typeof session.user & {
      country?: string | null;
    };

    const name = customUser.name ?? customUser.email?.split("@")[0] ?? "";
    const [first = "", ...rest] = name.trim().split(/\s+/);

    form.reset({
      ...form.getValues(),
      email: form.getValues("email") || (customUser.email ?? ""),
      firstName: form.getValues("firstName") || first,
      lastName: form.getValues("lastName") || rest.join(" "),
      country: form.getValues("country") || (customUser.country ?? ""),
    });
  }, [session, form]);

  return (
    <div className="mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create Your Profile</h1>
        <p className="text-muted-foreground">
          Fill in your details to create a professional resume
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          className="space-y-8"
        >
          <div>
            <div>
              <ElevatorPitchUpload
                onFileSelect={setElevatorPitchFile}
                selectedFile={elevatorPitchFile}
                uploadedVideoUrl={uploadedVideoUrl}
                onDelete={handleElevatorPitchDelete}
                isUploaded={isElevatorPitchUploaded}
              />
              {elevatorPitchFile && !isElevatorPitchUploaded && (
                <Button
                  type="button"
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleElevatorPitchUpload}
                  disabled={uploadElevatorPitchMutation.isPending}
                >
                  {uploadElevatorPitchMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    "Upload Elevator Pitch"
                  )}
                </Button>
              )}
              {isElevatorPitchUploaded && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">
                    ✓ Elevator pitch upload finished! We’re processing your
                    video—feel free to submit your resume while it finalizes.
                  </p>
                </div>
              )}
            </div>
          </div>

          <BannerUpload
            onFileSelect={handleBannerUpload}
            previewUrl={bannerPreview}
          />

          <PersonalInfoSection
            form={form}
            photoPreview={photoPreview}
            onPhotoUpload={handlePhotoUpload}
          />

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showcase your strengths and what sets you apart.
              </p>
            </CardHeader>
            <CardContent>
              <SkillsSelector
                selectedSkills={selectedSkills}
                onSkillsChange={setSelectedSkills}
                error={form.formState.errors.skills?.message}
              />
            </CardContent>
          </Card>

          <ExperienceSection
            form={form}
            experienceFields={experienceFields}
            appendExperience={appendExperience}
            removeExperience={removeExperience}
          />

          <EducationSection
            form={form}
            educationFields={educationFields}
            appendEducation={appendEducation}
            removeEducation={removeEducation}
          />

          <CertificationsSection form={form} />

          <LanguageSection form={form} />

          <AwardsSection
            form={form}
            awardFields={awardFields}
            appendAward={appendAward}
            removeAward={removeAward}
          />

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-blue-700 text-white py-6 text-lg font-medium"
            disabled={
              createResumeMutation.isPending ||
              form.formState.isSubmitting ||
              !isElevatorPitchUploaded
            }
          >
            {createResumeMutation.isPending || form.formState.isSubmitting ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Profile...
              </div>
            ) : !isElevatorPitchUploaded ? (
              "Upload Elevator Pitch First"
            ) : (
              "Create Profile"
            )}
          </Button>

          {!isElevatorPitchUploaded && (
            <p className="text-center text-sm text-red-600">
              Please upload your Elevator Video Pitch© video before submitting
              the form.
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}
