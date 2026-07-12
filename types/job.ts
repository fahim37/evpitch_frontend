import { z } from "zod";

export const jobSchema = z.object({
  jobTitle: z
    .string()
    .min(1, "Job title is required")
    .max(100, "Job title cannot exceed 100 characters"),

  department: z
    .string()
    .max(100, "Department name cannot exceed 100 characters")
    .optional(),

  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country name cannot exceed 100 characters"),

  region: z
    .string()
    .min(1, "City is required")
    .max(100, "City name cannot exceed 100 characters"),

  vacancy: z
    .number()
    .min(1, "Vacancy must be at least 1")
    .max(50, "Vacancy cannot exceed 50"),

  employement_Type: z.enum([
    "full-time",
    "part-time",
    "internship",
    "contract",
    "temporary",
    "freelance",
    "volunteer",
  ]),

  experience: z.enum(["entry", "mid", "senior", "executive"]),

  locationType: z.enum(["onsite", "remote", "hybrid"]),

  careerStage: z.enum([
    "New Entry",
    "Experienced Professional",
    "Career Returner",
  ]),

  categoryId: z
    .string()
    .min(1, "Category is required")
    .max(50, "Invalid category"),

  role: z.string().max(100, "Role cannot exceed 100 characters"),

  compensation: z.string().max(50, "Compensation string too long").optional(),

  expirationDate: z
    .string()
    .min(1, "Expiration date is required")
    .max(20, "Invalid expiration date"),

  companyUrl: z.union([
  z.string().url("Invalid URL").max(200),
  z.literal(""),
]).optional(),


  jobDescription: z
    .string()
    .max(2000, "Description too long")
    .min(1, "Description is required")
    .refine(
      (value) => {
        const wordCount = value
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
        return wordCount >= 20;
      },
      {
        message: "Job description must have at least 20 words",
      }
    ),

  publishDate: z.string().optional(),

  applicationRequirements: z
    .array(
      z.object({
        requirement: z.string().max(200, "Requirement too long"),
        status: z.string().optional(), // allow empty / not set
      })
    )
    .optional(),

  customQuestions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string().max(500, "Question too long").optional(),
      })
    )
    .optional(),

  userId: z.string().optional(),
});

export type JobFormData = z.infer<typeof jobSchema>;
