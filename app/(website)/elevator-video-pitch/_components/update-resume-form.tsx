"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { SocialLinksSection } from "./social-links-section";
import { LanguageSelector } from "./resume/language-selector";
import { CertificationSelector } from "./resume/certification-selector";
import { BannerUpload } from "@/components/shared/banner-upload";
import { PhotoAboutSection } from "./update-resume/photo-about-section";
import { PersonalInfoSection } from "./update-resume/personal-info-section";
import { SkillsSelector } from "./update-resume/skills-selector";
import { ExperienceSection } from "./update-resume/experience-section";
import { EducationSection } from "./update-resume/education-section";
import { AwardsSection } from "./update-resume/awards-section";

// Utility function to compare dates (format: MM/YYYY)
const isDateValid = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return true;
  const [startMonth, startYear] = startDate.split("/").map(Number);
  const [endMonth, endYear] = endDate.split("/").map(Number);
  if (startYear > endYear) return false;
  if (startYear === endYear && startMonth > endMonth) return false;
  return true;
};

const getWordCount = (value: string) => {
  const text = value.trim();
  return text ? text.split(/\s+/).length : 0;
};

export const resumeFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  title: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  aboutUs: z
    .string()
    .optional()
    .refine((value) => !value || getWordCount(value) <= 200, {
      message: "About section cannot exceed 200 words",
    }),
  banner: z.string().optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  immediatelyAvailable: z.boolean().optional(),
  certifications: z.array(z.string()).optional(),
  sLink: z
    .array(
      z.object({
        _id: z.string().optional(),
        type: z.enum(["create", "update", "delete"]).optional(),
        label: z.string().min(1, "Platform name is required"),
        url: z
          .string()
          .optional()
          .transform((v) => v ?? "")
          .pipe(z.string().url("Please enter a valid URL").or(z.literal(""))),
      })
    )
    .optional(),
  experiences: z
    .array(
      z
        .object({
          _id: z.string().optional(),
          type: z.enum(["create", "update", "delete"]).optional(),
          company: z.string().optional(),
          jobTitle: z.string().optional(),
          position: z.string().optional(),
          duration: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          currentlyWorking: z.boolean().optional().default(false),
          country: z.string().optional(),
          city: z.string().optional(),
          zip: z.string().optional(),
          jobDescription: z.string().optional(),
          jobCategory: z.string().optional(),
        })
        .refine(
          (data) =>
            !data.company ||
            !data.jobTitle ||
            data.currentlyWorking === true ||
            (!!data.endDate && data.currentlyWorking === false),
          {
            message: "End date is required unless Current Position is checked",
            path: ["endDate"],
          }
        )
        .refine(
          (data) =>
            data.currentlyWorking === true ||
            !data.startDate ||
            !data.endDate ||
            isDateValid(data.startDate, data.endDate),
          {
            message: "End date cannot be earlier than start date",
            path: ["endDate"],
          }
        )
    )
    .optional(),
  educationList: z
    .array(
      z
        .object({
          _id: z.string().optional(),
          type: z.enum(["create", "update", "delete"]).optional(),
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
            // ✅ Graduation date required only if instituteName & startDate exist AND not currently studying
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
        _id: z.string().optional(),
        type: z.enum(["create", "update", "delete"]).optional(),
        title: z.string().optional(),
        programeName: z.string().optional(),
        year: z.string().optional(),
        programeDate: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

type ResumeFormData = z.infer<typeof resumeFormSchema>;

interface Country {
  country: string;
  cities: string[];
}

interface UpdateResumeFormProps {
  resume: any;
  onCancel: () => void;
  onUpdate: (data: FormData) => Promise<void>;
  onDelete?: (id: string, type: string) => Promise<void>;
}

export default function UpdateResumeForm({
  resume,
  onCancel,
  onUpdate,
}: UpdateResumeFormProps): React.ReactElement {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    resume.resume?.skills || []
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    resume.resume?.photo || null
  );
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    resume.resume?.banner || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    resume.resume?.country || ""
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    resume.resume?.languages || []
  );
  const [selectedCertifications, setSelectedCertifications] = useState<
    string[]
  >(resume.resume?.certifications || []);

  const { data: countriesData, isLoading: isLoadingCountries } = useQuery<
    Country[]
  >({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/countries`
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch countries");
      return data.data as Country[];
    },
  });

  const { data: citiesData, isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ["cities", selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return [];
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
      return data.data as string[];
    },
    enabled: !!selectedCountry,
  });

  const formatDateForMongoDB = (dateString: string): string => {
    if (!dateString || dateString.trim() === "") return "";

    const [month, year] = dateString.split("/");
    if (!month || !year || month.length !== 2 || year.length !== 4) {
      return "";
    }

    const monthNum = Number.parseInt(month, 10);
    const yearNum = Number.parseInt(year, 10);

    if (monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return "";
    }

    return new Date(yearNum, monthNum - 1, 1).toISOString();
  };

  const form = useForm<ResumeFormData>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: {
      firstName: resume.resume?.firstName || "",
      lastName: resume.resume?.lastName || "",
      email: resume.resume?.email || "",
      title: resume.resume?.title || "",
      banner: resume.resume?.banner || "",
      city: resume.resume?.city || "",
      zipCode: resume.resume?.zipCode || "",
      country: resume.resume?.country || "",
      immediatelyAvailable: resume.resume?.immediatelyAvailable || false,
      aboutUs: resume.resume?.aboutUs || "",
      skills: Array.isArray(resume.resume?.skills) ? resume.resume.skills : [],
      sLink:
        Array.isArray(resume.resume?.sLink) && resume.resume.sLink.length > 0
          ? resume.resume.sLink.map(
              (link: { _id?: string; label: string; url: string }) => ({
                _id: link._id,
                type: link._id ? "update" : "create",
                label: link.label || "",
                url: link.url || "",
              })
            )
          : [],
      experiences: (() => {
        if (
          Array.isArray(resume.experiences) &&
          resume.experiences.length > 0
        ) {
          return resume.experiences.map((exp: any) => ({
            _id: exp._id || undefined,
            type: exp._id ? "update" : "create",
            company: exp.company || "",
            jobTitle: exp.position || exp.jobTitle || "",
            duration: exp.duration || "",
            startDate: exp.startDate
              ? new Date(exp.startDate)
                  .toLocaleDateString("en-US", {
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace("/", "/")
              : "",
            endDate: exp.endDate
              ? new Date(exp.endDate)
                  .toLocaleDateString("en-US", {
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace("/", "/")
              : "",
            currentlyWorking:
              exp.currentlyWorking || (!exp.endDate && !!exp.startDate),
            country: exp.country || "",
            city: exp.city || "",
            zip: exp.zip || "",
            jobDescription: exp.jobDescription || "",
            jobCategory: exp.jobCategory || "",
          }));
        }
        return [
          {
            type: "create",
            company: "",
            jobTitle: "",
            duration: "",
            startDate: "",
            endDate: "",
            currentlyWorking: false,
            country: "",
            city: "",
            zip: "",
            jobDescription: "",
            jobCategory: "",
          },
        ];
      })(),
      educationList: (() => {
        if (Array.isArray(resume.education) && resume.education.length > 0) {
          return resume.education.map((edu: any) => ({
            _id: edu._id || undefined,
            type: edu._id ? "update" : "create",
            instituteName: edu.instituteName || edu.university || "",
            degree: edu.degree || "",
            fieldOfStudy: edu.fieldOfStudy || "",
            startDate: edu.startDate
              ? new Date(edu.startDate)
                  .toLocaleDateString("en-US", {
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace("/", "/")
              : "",
            graduationDate: edu.graduationDate
              ? new Date(edu.graduationDate)
                  .toLocaleDateString("en-US", {
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace("/", "/")
              : "",
            currentlyStudying:
              edu.currentlyStudying || (!edu.graduationDate && !!edu.startDate),
            city: edu.city || "",
            country: edu.country || "",
          }));
        }
        return [
          {
            type: "create",
            instituteName: "",
            degree: "",
            fieldOfStudy: "",
            startDate: "",
            graduationDate: "",
            currentlyStudying: false,
            city: "",
            country: "",
          },
        ];
      })(),
      awardsAndHonors: (() => {
        if (
          Array.isArray(resume.awardsAndHonors) &&
          resume.awardsAndHonors.length > 0
        ) {
          return resume.awardsAndHonors.map((award: any) => ({
            _id: award._id || undefined,
            type: award._id ? "update" : "create",
            title: award.title || "",
            programeName: award.programeName || "",
            programeDate: award.programeDate || "",
            description: award.description || "",
          }));
        }
        return [
          {
            type: "create",
            title: "",
            programeName: "",
            programeDate: "",
            description: "",
          },
        ];
      })(),
      languages: Array.isArray(resume.resume?.languages)
        ? resume.resume.languages
        : [],
      certifications: Array.isArray(resume.resume?.certifications)
        ? resume.resume.certifications
        : [],
    },
  });

  useEffect(() => {
    const experiences = form.watch("experiences") || [];

    experiences.forEach((experience, index) => {
      if (experience.type === "delete") return;

      const startDate = experience.startDate;
      const endDate = experience.endDate;
      const currentlyWorking = experience.currentlyWorking;

      if (!currentlyWorking && startDate && endDate) {
        if (!isDateValid(startDate, endDate)) {
          form.setError(`experiences.${index}.endDate`, {
            type: "manual",
            message: "End date cannot be earlier than start date",
          });
        } else {
          const currentError =
            form.formState.errors.experiences?.[index]?.endDate;
          if (currentError?.type === "manual") {
            form.clearErrors(`experiences.${index}.endDate`);
          }
        }
      }
    });
  }, [form, form.watch("experiences")]);

  useEffect(() => {
    const educationList = form.watch("educationList") || [];

    educationList.forEach((education, index) => {
      if (education.type === "delete") return;

      const startDate = education.startDate;
      const graduationDate = education.graduationDate;
      const currentlyStudying = education.currentlyStudying;

      if (!currentlyStudying && startDate && graduationDate) {
        if (!isDateValid(startDate, graduationDate)) {
          form.setError(`educationList.${index}.graduationDate`, {
            type: "manual",
            message: "Graduation date cannot be earlier than start date",
          });
        } else {
          const currentError =
            form.formState.errors.educationList?.[index]?.graduationDate;
          if (currentError?.type === "manual") {
            form.clearErrors(`educationList.${index}.graduationDate`);
          }
        }
      }
    });
  }, [form, form.watch("educationList")]);

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperienceFields,
  } = useFieldArray({
    control: form.control,
    name: "experiences",
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducationFields,
  } = useFieldArray({
    control: form.control,
    name: "educationList",
  });

  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAwardFields,
  } = useFieldArray({
    control: form.control,
    name: "awardsAndHonors",
  });

  const handleBannerSelect = (file: File | null) => {
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

  const handlePhotoSelect = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const onSubmit = async (data: ResumeFormData) => {
    try {
      setIsSubmitting(true);
      const isValid = await form.trigger();
      if (!isValid) {
        const firstError = Object.values(form.formState.errors)[0];
        toast.error(firstError.message || "Please fill in all required fields");
        return;
      }

      const formData = new FormData();
      const resumeObject = {
        type: "update",
        _id: resume.resume?._id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        title: data.title || "",
        city: data.city || "",
        zipCode: data.zipCode || "",
        immediatelyAvailable: data.immediatelyAvailable,
        country: data.country || "",
        aboutUs: data.aboutUs,
        skills: Array.isArray(data.skills) ? data.skills : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        certifications: Array.isArray(data.certifications)
          ? data.certifications
          : [],
        sLink: (data.sLink || [])
          .filter((link) => link.url && link.url.trim() !== "")
          .map((link) => ({
            _id: link._id,
            type: link._id
              ? link.type === "delete"
                ? "delete"
                : "update"
              : "create",
            label: link.label,
            url: link.url,
          })),
      };

      const processedExperiences = (data.experiences || []).map((exp) => ({
        ...exp,
        type: exp._id
          ? exp.type === "delete"
            ? "delete"
            : "update"
          : "create",
        position: exp.jobTitle,
        startDate: exp.startDate ? formatDateForMongoDB(exp.startDate) : "",
        endDate: exp.currentlyWorking
          ? ""
          : exp.endDate
          ? formatDateForMongoDB(exp.endDate)
          : "",
      }));

      const processedEducation = (data.educationList || []).map((edu) => ({
        ...edu,
        type: edu._id
          ? edu.type === "delete"
            ? "delete"
            : "update"
          : "create",
        university: edu.instituteName,
        startDate: edu.startDate ? formatDateForMongoDB(edu.startDate) : "",
        graduationDate: edu.currentlyStudying
          ? ""
          : edu.graduationDate
          ? formatDateForMongoDB(edu.graduationDate)
          : "",
      }));

      const processedAwards = (data.awardsAndHonors || []).map((award) => ({
        ...award,
        type: award._id
          ? award.type === "delete"
            ? "delete"
            : "update"
          : "create",
        programeDate: award.programeDate || "",
      }));

      formData.append("resume", JSON.stringify(resumeObject));
      formData.append("experiences", JSON.stringify(processedExperiences));
      formData.append("educationList", JSON.stringify(processedEducation));
      formData.append("awardsAndHonors", JSON.stringify(processedAwards));

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      if (bannerFile) {
        formData.append("banner", bannerFile);
      }

      await onUpdate(formData);
      toast.success("Elevator Pitch updated successfully");
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Failed to update resume. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Update Profile</h1>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <BannerUpload
            onFileSelect={handleBannerSelect}
            previewUrl={bannerPreview}
          />

          <PhotoAboutSection
            form={form}
            photoPreview={photoPreview}
            onPhotoSelect={handlePhotoSelect}
          />

          <PersonalInfoSection
            form={form}
            countriesData={countriesData || []}
            citiesData={citiesData || []}
            isLoadingCountries={isLoadingCountries}
            isLoadingCities={isLoadingCities}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
          />

          <div className="mt-6">
            <FormField
              control={form.control}
              name="sLink"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SocialLinksSection form={form} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SkillsSelector
                        selectedSkills={selectedSkills}
                        onSkillsChange={(skills) => {
                          setSelectedSkills(skills);
                          field.onChange(skills);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div>
            <div className="mb-4">
              <h3>Languages</h3>
            </div>
            <div>
              <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <LanguageSelector
                        selectedLanguages={selectedLanguages}
                        onLanguagesChange={(languages) => {
                          setSelectedLanguages(languages);
                          field.onChange(languages);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h3>Certifications</h3>
            </div>
            <div>
              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CertificationSelector
                        selectedCertifications={selectedCertifications}
                        onCertificationsChange={(certifications) => {
                          setSelectedCertifications(certifications);
                          field.onChange(certifications);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <ExperienceSection form={form} />

          <EducationSection form={form} />

          <AwardsSection form={form} awardFields={awardFields} />

          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-primary hover:bg-blue-700 text-white py-6 text-lg font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Profile"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="py-6 text-lg font-medium bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
