"use client";

import { useEffect, useMemo, useState, useCallback } from "react"; // Added useCallback here
import { useSession } from "next-auth/react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combo-box";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmployeeSelector } from "@/components/company/employee-selector";
import { DynamicInputList } from "@/components/company/dynamic-input-list";
import { ElevatorPitchUpload } from "./elevator-pitch-upload";
import {
  createCompany,
  uploadElevatorPitch,
  deleteElevatorPitchVideo,
} from "@/lib/api-service";
import { SocialLinksSection } from "./social-links-section";
import { AwardsSection } from "./resume/awards-section";
import { BannerUpload } from "@/components/shared/banner-upload";
import { convertToISODate } from "@/lib/date-utils";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image"; // Added for Image component
import { X } from "lucide-react"; // Added for X icon
import TextEditor from "@/components/MultiStepJobForm/TextEditor";

interface Country {
  country: string;
  cities?: string[];
}

interface DialCode {
  name: string;
  dial_code: string;
  code: string;
}

const formSchema = z.object({
  cname: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name is too long"),
  country: z
    .string()
    .min(1, "Country is required")
    .max(50, "Country name is too long"),
  city: z.string().min(1, "City is required").max(50, "City name is too long"),
  zipcode: z.string().max(20, "Zip code is too long"),
  cemail: z
    .string()
    .email("Invalid email address")
    .max(100, "Email is too long"),
  aboutUs: z
    .string()
    .min(1, "About us is required")
    .refine(
      (value) => value.trim().split(/\s+/).length <= 200,
      "About us must not exceed 200 words"
    ),

  industry: z
    .string()
    .min(1, "Industry is required")
    .max(100, "Industry is too long"),
  banner: z.any().optional(),
  sLink: z
    .array(
      z.object({
        label: z.string().max(50, "Label is too long"),
        url: z
          .string()
          .url("Please enter a valid URL")
          .optional()
          .or(z.literal("")),
      })
    )
    .optional(),
  awardsAndHonors: z
    .array(
      z.object({
        title: z.string().optional().or(z.literal("")),
        programeName: z.string().optional().or(z.literal("")),
        programeDate: z.string().optional().or(z.literal("")),
        description: z.string().optional().or(z.literal("")),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

interface LogoUploadProps {
  onFileSelect: (file: File | null) => void;
  previewUrl?: string | null;
}

function LogoUpload({ onFileSelect, previewUrl }: LogoUploadProps) {
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

  const removeLogo = () => {
    onFileSelect(null);
    setSelectedImage(null);
    setCropModalOpen(false);
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []); // useCallback is now imported and functional

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<File> => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const outputSize = 200;
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
          resolve(new File([blob], "cropped-logo.jpg", { type: "image/jpeg" }));
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
        className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
          dragActive
            ? "border-green-500 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("logo-upload")?.click()}
      >
        {previewUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={previewUrl}
              alt="Logo preview"
              fill
              className="object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                removeLogo();
              }}
              className="absolute top-1 right-1 h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="w-full h-full bg-primary text-white flex items-center justify-center text-sm font-medium rounded-lg">
            Company logo
          </div>
        )}
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
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
            "Crop Logo"
          )}
        </Button>
      )}
      {previewUrl && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-medium">
            ✓ Logo uploaded successfully!
          </p>
        </div>
      )}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crop Company Logo</DialogTitle>
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

export default function CreateCompanyPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [isElevatorPitchUploaded, setIsElevatorPitchUploaded] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([""]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string>("");

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

  const { data: dialCodesData, isLoading: isLoadingDialCodes } = useQuery<
    DialCode[]
  >({
    queryKey: ["dialCodes"],
    queryFn: async () => {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/codes"
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch dial codes");
      return data.data as DialCode[];
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

  const countryOptions = useMemo(
    () =>
      countriesData?.map((c) => ({ value: c.country, label: c.country })) || [],
    [countriesData]
  );
  const cityOptions = useMemo(
    () => citiesData?.map((c) => ({ value: c, label: c })) || [],
    [citiesData]
  );

  const dialCodeByCountry = useMemo(() => {
    const map = new Map<string, string>();
    (dialCodesData || []).forEach((d) => map.set(d.name, d.dial_code));
    return map;
  }, [dialCodesData]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cname: "",
      country: "",
      city: "",
      zipcode: "",
      cemail: "",
      banner: null,
      aboutUs: "",
      industry: "",
      sLink: [],
      awardsAndHonors: [],
    },
  });

  const watchedCountry = form.watch("country");
  useEffect(() => {
    setSelectedCountry(watchedCountry || "");
  }, [watchedCountry]);

  useEffect(() => {
    if (!session?.user) return;

    const sessCountry = (session.user as any)?.country ?? "";
    const sessEmail = session.user.email ?? "";
    const sessName = session.user.name ?? "";

    form.reset({
      ...form.getValues(),
      cname: sessName || form.getValues("cname"),
      country: sessCountry || form.getValues("country"),
      cemail: sessEmail || form.getValues("cemail"),
    });
  }, [session, form]);

  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAward,
  } = useFieldArray({
    control: form.control,
    name: "awardsAndHonors",
  });

  const createCompanyMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      toast.success("Company created successfully!");
      queryClient.invalidateQueries({ queryKey: ["company"] });

      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create company");
    },
  });

  const { data: industriesData, isLoading: isLoadingIndustries } = useQuery({
    queryKey: ["industries"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/category/job-category`
      );
      const data = await response.json();
      if (!data.success) throw new Error("Failed to fetch industries");
      return data.data.category;
    },
  });

  const industryOptions = useMemo(
    () =>
      industriesData?.map((category: { name: string }) => ({
        value: category.name,
        label: category.name,
      })) || [],
    [industriesData]
  );

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
      console.log(error.response?.data?.message || "Failed to upload video");
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
      console.log(error.response?.data?.message || "Failed to delete video");
    },
  });

  const handleElevatorPitchUpload = async () => {
    if (!elevatorPitchFile || !session?.user?.id) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      try {
        await deleteElevatorPitchMutation.mutateAsync(session.user.id);
      } catch (_) {
        // no-op
      }

      await uploadElevatorPitchMutation.mutateAsync({
        videoFile: elevatorPitchFile,
        userId: session.user.id,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Could not upload your elevator pitch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleElevatorPitchDelete = async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }
    deleteElevatorPitchMutation.mutate(userId);
  };

  useEffect(() => {
    if (bannerFile) {
      const objectUrl = URL.createObjectURL(bannerFile);
      setBannerPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setBannerPreviewUrl(null);
    }
  }, [bannerFile]);

  const handleBannerSelect = (file: File | null) => {
    setBannerFile(file);
    form.setValue("banner", file);
  };

  const onSubmit = async (data: FormData) => {
    const userId = (session?.user as any)?.id;
    if (!userId) {
      toast.error("Please log in to create a company.");
      return;
    }
    if (!isElevatorPitchUploaded) {
      toast.error("Please upload an elevator pitch video before submitting.");
      return;
    }

    const formData = new FormData();

    if (bannerFile) {
      formData.append("banner", bannerFile);
    }
    if (logoFile) {
      formData.append("clogo", logoFile);
    }

    const base = {
      cname: data.cname,
      country: data.country,
      city: data.city,
      zipcode: data.zipcode,
      cemail: data.cemail,
      aboutUs: data.aboutUs,
      industry: data.industry,
    };
    Object.entries(base).forEach(([k, v]) => formData.append(k, v ?? ""));

    const sLinks = (data.sLink ?? [])
      .filter((s) => s.label && (s.url || s.url === ""))
      .map((s) => ({
        label: s.label,
        url: s.url || "",
      }));

    const allLinks = [...sLinks];
    formData.append("sLink", JSON.stringify(allLinks));

    const filteredServices = services.map((s) => s.trim()).filter(Boolean);
    formData.append("service", JSON.stringify(filteredServices));

    formData.append("employeesId", JSON.stringify(selectedEmployees));

    const awardsWithISODates = (data.awardsAndHonors ?? [])
      .filter((a) => (a.title ?? "").trim())
      .map((award) => ({
        ...award,
        programeDate: convertToISODate(award.programeDate || ""),
      }));

    formData.append("AwardsAndHonors", JSON.stringify(awardsWithISODates));

    try {
      await createCompanyMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8 bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Create Company/Business Account
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Company Elevator Video Pitch©
                </h2>
                <p className="text-sm text-gray-600 max-w-2xl">
                  Upload a 60-second elevator video pitch introducing your
                  company and what should make candidates want to join you!
                </p>
              </div>
            </div>

            <ElevatorPitchUpload
              onFileSelect={setElevatorPitchFile}
              selectedFile={elevatorPitchFile}
              uploadedVideoUrl={uploadedVideoUrl}
              onDelete={handleElevatorPitchDelete}
              isUploaded={isElevatorPitchUploaded}
            />
            <div className="flex justify-center">
              <Button
                type="button"
                className="w-full bg-primary hover:bg-blue-700 text-white py-3 text-lg font-medium"
                onClick={handleElevatorPitchUpload}
                disabled={
                  !elevatorPitchFile ||
                  uploadElevatorPitchMutation.isPending ||
                  isElevatorPitchUploaded
                }
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
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Company Banner
            </h2>
            <BannerUpload
              onFileSelect={handleBannerSelect}
              previewUrl={bannerPreviewUrl}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Company Logo
              </Label>
              <div className="aspect-square">
                <LogoUpload
                  onFileSelect={setLogoFile}
                  previewUrl={logoFile ? URL.createObjectURL(logoFile) : null}
                />
              </div>
            </div>

            <div className="md:col-span-3 space-y-2">
              <FormField
                control={form.control}
                name="aboutUs"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Word count: {field.value.trim().split(/\s+/).length}
                      /200
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="cname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Company Name*
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your Company Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country*</FormLabel>
                    <FormControl>
                      <Combobox
                        options={countryOptions}
                        value={field.value || ""}
                        onChange={(val) => {
                          field.onChange(val);
                          form.setValue("city", "");
                        }}
                        placeholder={
                          isLoadingCountries
                            ? "Loading countries..."
                            : "Select Country"
                        }
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
                    <FormLabel>City*</FormLabel>
                    <FormControl>
                      <Combobox
                        options={cityOptions}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={
                          !form.getValues("country")
                            ? "Select country first"
                            : isLoadingCities
                            ? "Loading cities..."
                            : "Select City"
                        }
                        minSearchLength={2}
                        disabled={isLoadingCities || !form.getValues("country")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Zip / Postal Code*
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter Zip/Postal Code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cemail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Email Address*
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter Your Email Address"
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <SocialLinksSection form={form} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Industry*
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={industryOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={
                        isLoadingIndustries
                          ? "Loading industries..."
                          : "Select Industry"
                      }
                      disabled={isLoadingIndustries}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DynamicInputList
              label="Services*"
              placeholder="Add Here"
              values={services}
              onChange={setServices}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              View your company recruiters
            </h3>
            <EmployeeSelector
              selectedEmployees={selectedEmployees}
              onEmployeesChange={setSelectedEmployees}
            />
          </div>

          <AwardsSection
            form={form}
            awardFields={awardFields}
            appendAward={(value) =>
              appendAward(
                value ?? {
                  title: "",
                  programeName: "",
                  programeDate: "",
                  description: "",
                }
              )
            }
            removeAward={removeAward}
          />

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-blue-700 text-white py-3 text-lg font-medium"
            disabled={
              createCompanyMutation.isPending || !isElevatorPitchUploaded
            }
          >
            {createCompanyMutation.isPending ? (
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
                Creating...
              </div>
            ) : (
              "Save"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
