"use client";

// =========================
// CreateRecruiterAccountForm.tsx (UPDATED)
// - sLink uses { label, url } (with legacy [link] back-compat in FormData)
// - Delete-before-upload flow for Elevator Pitch
// - Full-width upload button, spinner, success banner
// - Integrated react-easy-crop for banner and photo uploads
// =========================

import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, ChevronsUpDown, Check } from "lucide-react";
import { BannerUpload } from "@/components/shared/banner-upload";
import { useSession } from "next-auth/react";
import {
  uploadElevatorPitch,
  deleteElevatorPitchVideo,
} from "@/lib/api-service";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import Image from "next/image";
import { CompanySelector } from "@/components/company/company-selector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ElevatorPitchUpload } from "./elevator-pitch-upload";
import { SocialLinksSection } from "./social-links-section";
import apiClient from "@/lib/api-service";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Option {
  value: string;
  label: string;
}
interface Education {
  school: string;
  degree: string;
  year: string;
}
interface SocialLink {
  label: string;
  url?: string;
}
interface Country {
  country: string;
  cities: string[];
}

interface BannerUploadProps {
  onFileSelect: (file: File | null) => void;
  previewUrl?: string | null;
  onUploadSuccess: () => void;
}

interface PhotoUploadProps {
  onFileSelect: (file: File | null) => void;
  previewUrl?: string | null;
  onUploadSuccess: () => void;
}

function PhotoUpload({
  onFileSelect,
  previewUrl,
  onUploadSuccess,
}: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removePhoto = () => {
    onFileSelect(null);
    setSelectedImage(null);
    setCropModalOpen(false);
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<File> => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const outputSize = 150;
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(
            new File([blob], "cropped-photo.jpg", { type: "image/jpeg" })
          );
        }
      }, "image/jpeg");
    });
  };

  const handleCropConfirm = async () => {
    if (selectedImage && croppedAreaPixels) {
      setIsProcessing(true);
      try {
        const croppedImage = await getCroppedImg(
          selectedImage,
          croppedAreaPixels
        );
        onFileSelect(croppedImage);
        setCropModalOpen(false);
        setSelectedImage(null);
        onUploadSuccess();
      } catch (error) {
        toast.error("Failed to process image");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <>
      <div
        className={`w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
          dragActive
            ? "border-green-500 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("photo-upload")?.click()}
      >
        {previewUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={previewUrl}
              alt="Photo preview"
              fill
              className="object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                removePhoto();
              }}
              className="absolute top-1 right-1 h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Upload className="h-8 w-8 text-gray-400" />
        )}
      </div>
      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      <p className="text-xs text-muted-foreground mt-2">
        JPG/PNG, up to 5MB. Square images work best.
      </p>
      {selectedImage && (
        <Button
          type="button"
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
          onClick={() => setCropModalOpen(true)}
          disabled={isProcessing}
        >
          {isProcessing ? (
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </div>
          ) : (
            "Crop Photo"
          )}
        </Button>
      )}
      {previewUrl && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-medium">
            ✓ Profile photo uploaded successfully!
          </p>
        </div>
      )}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crop Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-[300px] bg-black">
            {selectedImage && (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={false}
                minZoom={0.5}
                maxZoom={3}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCropModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm} disabled={isProcessing}>
              Confirm Crop
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const urlOptional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional()
  .pipe(z.string().url("Invalid URL").optional());

const recruiterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  sureName: z.string().optional(),
  emailAddress: z.string().email("Invalid email address"),
  title: z.string().min(1, "Current position is required"),
  bio: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  companyRecruiters: z.array(z.string()).optional(),
  sLink: z
    .array(
      z.object({
        label: z.string().min(1, "Platform name is required"),
        url: urlOptional,
      })
    )
    .optional(),
  companyId: z.string().optional(),
  userId: z.string().optional(),
});

type RecruiterFormData = z.infer<typeof recruiterSchema>;

function Combobox({
  options,
  value,
  onChange,
  placeholder,
  minSearchLength = 0,
  disabled = false,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minSearchLength?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  const displayedOptions = filteredOptions.slice(0, 100);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < minSearchLength ? (
              <CommandEmpty>
                Type at least {minSearchLength} characters to search.
              </CommandEmpty>
            ) : displayedOptions.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {displayedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredOptions.length > 100 && (
              <CommandItem disabled>
                More results available. Refine your search.
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function CreateRecruiterAccountForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>();
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [isElevatorPitchUploaded, setIsElevatorPitchUploaded] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBannerUploaded, setIsBannerUploaded] = useState(false);
  const [isPhotoUploaded, setIsPhotoUploaded] = useState(false);

  const form = useForm<RecruiterFormData>({
    resolver: zodResolver(recruiterSchema),
    defaultValues: {
      firstName: "",
      sureName: "",
      emailAddress: "",
      title: "",
      bio: "",
      country: "",
      city: "",
      zipCode: "",
      skills: [],
      languages: [],
      companyRecruiters: [],
      sLink: [
        { label: "LinkedIn", url: "" },
        { label: "Twitter", url: "" },
        { label: "Upwork", url: "" },
        { label: "Facebook", url: "" },
        { label: "TikTok", url: "" },
        { label: "Instagram", url: "" },
      ],
      companyId: "",
      userId: userId || "",
    },
  });

  const { data: countries, isLoading: isLoadingCountries } = useQuery<
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

  const { data: cities, isLoading: isLoadingCities } = useQuery<string[]>({
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

  useEffect(() => {
    if (countries && countries.length > 0 && !form.getValues("country")) {
      const defaultCountry = countries[0].country;
      form.setValue("country", defaultCountry);
      setSelectedCountry(defaultCountry);
    }
  }, [countries, form]);

  useEffect(() => {
    if (selectedCompany) {
      form.setValue("companyId", selectedCompany);
    }
  }, [selectedCompany, form]);

  useEffect(() => {
    if (userId) {
      form.setValue("userId", userId);
    }
  }, [userId, form]);

  useEffect(() => {
    const cleanupAttributes = () => {
      document
        .querySelectorAll(
          "[bis_skin_checked], [bis_register], [__processed_b668fbb6-84d8-4f67-8dbe-4c6dc7981cbf__]"
        )
        .forEach((el) => {
          el.removeAttribute("bis_skin_checked");
          el.removeAttribute("bis_register");
          el.removeAttribute(
            "__processed_b668fbb6-84d8-4f67-8dbe-4c6dc7981cbf__"
          );
        });
    };
    cleanupAttributes();
  }, []);

  const uploadElevatorPitchMutation = useMutation({
    mutationFn: async ({
      videoFile,
      userId,
    }: {
      videoFile: File;
      userId: string;
    }) => {
      return await uploadElevatorPitch({ videoFile, userId });
    },
    onSuccess: (data) => {
      setIsElevatorPitchUploaded(true);
      setUploadedVideoUrl(data.videoUrl);
      toast.success(
        "Upload completed! We’re processing your video—check back shortly."
      );
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to upload elevator pitch"
      );
    },
  });

  const deleteElevatorPitchMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await deleteElevatorPitchVideo(userId);
    },
    onSuccess: () => {
      setIsElevatorPitchUploaded(false);
      setUploadedVideoUrl(null);
      setElevatorPitchFile(null);
    },
    onError: (error: any) => {
      console.log(error);
    },
  });

  const createRecruiterAccount = async (data: RecruiterFormData) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === "sLink") {
        (value as SocialLink[])?.forEach((item, index) => {
          if (!item?.label) return;
          formData.append(`sLink[${index}][label]`, item.label);
          if (item.url) {
            formData.append(`sLink[${index}][url]`, item.url);
            formData.append(`sLink[${index}][link]`, item.url);
          }
        });
        return;
      }

      if (key === "educations") {
        formData.append("educations", JSON.stringify(value));
        return;
      }

      if (
        key === "skills" ||
        key === "languages" ||
        key === "companyRecruiters"
      ) {
        formData.append(key, JSON.stringify(value));
        return;
      }

      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (photoFile) formData.append("photo", photoFile);
    if (bannerFile) formData.append("banner", bannerFile);

    try {
      const response = await apiClient.post(
        "/recruiter/recruiter-account",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };

  const mutation = useMutation({
    mutationFn: createRecruiterAccount,
    onSuccess: () => {
      toast.success("Recruiter account created successfully");
      queryClient.invalidateQueries({ queryKey: ["recruiter"] });
      queryClient.invalidateQueries({ queryKey: ["company-account"] });
      queryClient.invalidateQueries({ queryKey: ["my-resume"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create recruiter account"
      );
    },
  });

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
  const handlePhotoSelect = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
      setIsPhotoUploaded(false);
    }
  };

  const handleElevatorPitchUpload = async () => {
    if (!elevatorPitchFile || !session?.user?.id) {
      toast.error("Please select a video file and ensure you are logged in");
      return;
    }

    try {
      await deleteElevatorPitchMutation.mutateAsync(session.user.id);
    } catch (_) {}

    uploadElevatorPitchMutation.mutate({
      videoFile: elevatorPitchFile,
      userId: session.user.id,
    });
  };

  const handleElevatorPitchDelete = async () => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }
    deleteElevatorPitchMutation.mutate(session.user.id);
  };

  const getFirstErrorMessage = (errors: any): string | undefined => {
    for (const key in errors) {
      const error = errors[key];
      if (error?.message) return `${key}: ${error.message}`;
      if (typeof error === "object") {
        for (const subKey in error) {
          if (error[subKey]?.message)
            return `${key}[${subKey}]: ${error[subKey].message}`;
          if (typeof error[subKey] === "object") {
            for (const subSubKey in error[subKey]) {
              if (error[subKey][subSubKey]?.message) {
                return `${key}[${subKey}].${subSubKey}: ${error[subKey][subSubKey].message}`;
              }
            }
          }
        }
      }
    }
    return undefined;
  };

  const onSubmit = async (data: RecruiterFormData) => {
    if (!isElevatorPitchUploaded) {
      toast.error("Please upload an elevator pitch video before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      const submissionData = { ...data, userId: userId || data.userId };
      await mutation.mutateAsync(submissionData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!session?.user) return;
    if (form.formState.isDirty) return;

    const name = session.user.name ?? session.user.email?.split("@")[0] ?? "";
    const [first = "", ...rest] = name.trim().split(/\s+/);

    form.reset({
      ...form.getValues(),
      emailAddress:
        form.getValues("emailAddress") || (session.user.email ?? ""),
      firstName: form.getValues("firstName") || first,
      sureName: form.getValues("sureName") || rest.join(" "),
      country: form.getValues("country") || (session.user.country ?? ""),
    });
  }, [session, form]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Create Recruiter Account</h1>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            async (data) => {
              await onSubmit(data);
            },
            (errors) => {
              const errorMessage = getFirstErrorMessage(errors);
              toast.error(errorMessage || "Please fill in all required fields");
            }
          )}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Elevator Video Pitch©
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload a short video introducing yourself. This is required
                before submitting.
              </p>
            </CardHeader>
            <CardContent>
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
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
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
                    video in the background—go ahead and submit.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <BannerUpload
            onFileSelect={handleBannerUpload}
            previewUrl={bannerPreview}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Profile Photo (Optional)
                  </Label>
                  <PhotoUpload
                    onFileSelect={handlePhotoSelect}
                    previewUrl={photoPreview}
                    onUploadSuccess={() => setIsPhotoUploaded(true)}
                  />
                </div>
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          About me
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Word count:{" "}
                          {(field.value ?? "").trim()
                            ? (field.value ?? "").trim().split(/\s+/).length
                            : 0}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sureName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter surname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address*</FormLabel>
                      <FormControl>
                        <Input
                          disabled
                          type="email"
                          placeholder="Enter email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Position*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter current position"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country*</FormLabel>
                      <FormControl>
                        <Combobox
                          options={(countries || []).map((c) => ({
                            value: c.country,
                            label: c.country,
                          }))}
                          value={field.value || ""}
                          onChange={(value) => {
                            field.onChange(value);
                            setSelectedCountry(value);
                          }}
                          placeholder={
                            isLoadingCountries ? "Loading..." : "Select Country"
                          }
                          minSearchLength={0}
                          disabled={isLoadingCountries}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City (Optional)</FormLabel>
                      <FormControl>
                        <Combobox
                          options={(cities || []).map((city) => ({
                            value: city,
                            label: city,
                          }))}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder={
                            !selectedCountry
                              ? "Select country first"
                              : isLoadingCities
                              ? "Loading..."
                              : "Select City"
                          }
                          minSearchLength={2}
                          disabled={isLoadingCities || !selectedCountry}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip/Postal Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Zip/Postal Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  View your company
                </h3>
                <CompanySelector
                  selectedCompany={selectedCompany}
                  onCompanyChange={setSelectedCompany}
                />
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <SocialLinksSection form={form} />
            </CardContent>
          </Card>
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
              disabled={
                mutation.isPending || isSubmitting || !isElevatorPitchUploaded
              }
            >
              {mutation.isPending || isSubmitting ? (
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
