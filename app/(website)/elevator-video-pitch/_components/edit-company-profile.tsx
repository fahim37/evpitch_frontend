// pages/EditCompanyPage.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X, Check, ChevronsUpDown } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FileUpload } from "@/components/company/file-upload";
import { EmployeeSelector } from "@/components/company/employee-selector";
import { useSession } from "next-auth/react";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import { SocialLinksSection } from "./social-links-section";
import { useRouter } from "next/navigation";
import CustomDateInput from "@/components/custom-date-input";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { LogoUpload } from "./logo-upload";
import { BannerUpload } from "@/components/shared/banner-upload";

// Types for countries and cities
interface Country {
  country: string;
}

// Fixed platforms for SocialLinksSection
const FIXED_PLATFORMS = [
  "LinkedIn",
  "Twitter",
  "Upwork",
  "Facebook",
  "TikTok",
  "Instagram",
] as const;

// near the top
const PLATFORMS_IN_STORAGE = [
  "LinkedIn",
  "Twitter",
  "Facebook",
  "TikTok",
  "Instagram",
  "Upwork",
  "Fiverr",
  "Others",
] as const;

// Form schema with sLink
const formSchema = z.object({
  cname: z.string().min(1, "Company name is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  zipcode: z.string(),
  cemail: z.string().email("Invalid email address"),
  aboutUs: z.string().min(1, "About us is required"),
  industry: z.string().min(1, "Industry is required"),
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
    .optional()
    .default([]),
});

type FormData = z.infer<typeof formSchema>;

interface Honor {
  id: string;
  _id?: string;
  title: string;
  issuer: string;
  programeDate: string;
  description: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

// API functions for countries and cities
const fetchCountries = async (): Promise<Country[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/countries`);
  const data = await response.json();
  if (data.error) throw new Error("Failed to fetch countries");
  return data.data as Country[];
};

const fetchCities = async (country: string): Promise<string[]> => {
  if (!country) return [];
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/countries/cities`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ country }),
    }
  );
  const data = await response.json();
  if (data.error) throw new Error("Failed to fetch cities");
  return data.data as string[];
};

interface EditCompanyPageProps {
  companyId: string;
}

function EditCompanyPage({ companyId }: EditCompanyPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([""]);
  const [honors, setHonors] = useState<Honor[]>([
    {
      id: "1",
      title: "",
      issuer: "",
      programeDate: "",
      description: "",
      isNew: true,
    },
  ]);
  const [originalHonors, setOriginalHonors] = useState<Honor[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cname: "",
      country: "",
      city: "",
      zipcode: "",
      cemail: "",
      aboutUs: "",
      industry: "",
      sLink: PLATFORMS_IN_STORAGE.map((label) => ({ label, url: "" })),
    },
  });

  const session = useSession();
  const token = session?.data?.accessToken || "";

  const { data: countriesData = [], isLoading: isLoadingCountries } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });

  const { data: citiesData = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities", selectedCountry],
    queryFn: () => fetchCities(selectedCountry),
    enabled: !!selectedCountry,
  });

  // Cleanup for URL.createObjectURL
  useEffect(() => {
    return () => {
      if (logoFile) {
        URL.revokeObjectURL(URL.createObjectURL(logoFile));
      }
    };
  }, [logoFile]);

  const { data: industriesData = [], isLoading: isLoadingIndustries } =
    useQuery({
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

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/company/user/${companyId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch company");
        }
        const data = await response.json();
        // Validate clogo URL
        const isValidUrl = (url: string) => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        };
        if (
          data?.data?.companies?.[0]?.clogo &&
          !isValidUrl(data.data.companies[0].clogo)
        ) {
          console.warn("Invalid logo URL, resetting to null");
          data.data.companies[0].clogo = null;
        }
        setCompanyData(data);
      } catch (error) {
        console.error("Error fetching company:", error);
        toast.error("Failed to load company data");
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  useEffect(() => {
    if (companyData?.data) {
      setBannerPreview(companyData.data.companies[0].banner);
    }
  }, [companyData]);

  useEffect(() => {
    if (companyData?.data?.companies?.[0]) {
      const company = companyData.data.companies[0];

      // build lookup for quick access
      const byLabel: Record<string, string> = {};
      (company.sLink ?? []).forEach((s: { label: string; url: string }) => {
        if (!s?.label) return;
        const key = s.label.trim() === "Other" ? "Others" : s.label.trim(); // normalize
        byLabel[key] = s.url ?? "";
      });

      // normalize sLink into our expected fixed order
      const normalizedSLink = PLATFORMS_IN_STORAGE.map((label) => ({
        label,
        url: byLabel[label] ?? "",
      }));

      // reset form with normalized values
      form.reset({
        cname: company.cname || "",
        country: company.country || "",
        city: company.city || "",
        zipcode: company.zipcode || "",
        cemail: company.cemail || "",
        aboutUs: company.aboutUs || "",
        industry: company.industry || "",
        sLink: normalizedSLink,
      });

      // other data loading logic (keep your existing code)
      if (company.service && company.service.length > 0) {
        setServices(company.service);
      } else {
        setServices([""]);
      }

      if (company.employeesId) {
        setSelectedEmployees(company.employeesId);
      }
    }

    if (companyData?.data?.honors && companyData.data.honors.length > 0) {
      const loadedHonors = companyData.data.honors.map(
        (honor: any, index: number) => ({
          id: `existing-${index}`,
          _id: honor._id,
          title: honor.title || "",
          issuer: honor.issuer || "",
          programeDate: honor.programeDate
            ? new Date(honor.programeDate).toISOString().split("T")[0]
            : "",
          description: honor.description || "",
          isNew: false,
        })
      );
      setHonors(loadedHonors);
      setOriginalHonors([...loadedHonors]);
    } else {
      setHonors([
        {
          id: "1",
          title: "",
          issuer: "",
          programeDate: "",
          description: "",
          isNew: true,
        },
      ]);
      setOriginalHonors([]);
    }
  }, [companyData, form]);

  const addService = () => {
    setServices([...services, ""]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, value: string) => {
    const updatedServices = [...services];
    updatedServices[index] = value;
    setServices(updatedServices);
  };

  const addHonor = () => {
    setHonors([
      ...honors,
      {
        id: `new-${Date.now()}`,
        title: "",
        issuer: "",
        programeDate: "",
        description: "",
        isNew: true,
      },
    ]);
  };

  const removeHonor = (id: string) => {
    const honorToRemove = honors.find((h) => h.id === id);

    if (honorToRemove?.isNew) {
      setHonors(honors.filter((honor) => honor.id !== id));
    } else {
      setHonors(
        honors.map((honor) =>
          honor.id === id ? { ...honor, isDeleted: true } : honor
        )
      );
    }
  };

  const updateHonor = (
    id: string,
    field: "title" | "issuer" | "programeDate" | "description",
    value: string
  ) => {
    setHonors(
      honors.map((honor) =>
        honor.id === id ? { ...honor, [field]: value } : honor
      )
    );
  };

  const updateCompany = async (data: any) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key === "honors" || key === "sLink") {
        formData.append(key, JSON.stringify(data[key]));
      } else if (Array.isArray(data[key])) {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    if (logoFile) {
      formData.append("clogo", logoFile);
    }

    if (bannerFile) {
      formData.append("banner", bannerFile);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/company/${companyData.data.companies[0]._id}`,
      {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update company");
    }

    return response.json();
  };

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

  const onSubmit = async (data: FormData) => {
    try {
      setIsUpdating(true);

      // clean up services
      const filteredServices = services.map((s) => s.trim()).filter(Boolean);

      // only keep social links with non-empty URL
      const cleanSLink = (data.sLink ?? [])
        .map(({ label, url }) => ({
          label: label === "Other" ? "Others" : label,
          url: (url ?? "").trim(),
        }))
        .filter((x) => x.url !== ""); // remove empty ones ✅

      // process honors as before
      const processedHonors = honors
        .filter((honor) => !honor.isDeleted)
        .filter(
          (honor) =>
            honor.title.trim() !== "" || honor.description.trim() !== ""
        )
        .map((honor) => {
          const baseHonor = {
            title: honor.title.trim(),
            issuer: honor.issuer.trim(),
            programeDate: honor.programeDate,
            description: honor.description.trim(),
          };

          if (honor.isNew) {
            return { ...baseHonor, type: "create" };
          } else {
            const original = originalHonors.find(
              (orig) => orig._id === honor._id
            );
            const isModified =
              !original ||
              original.title !== honor.title ||
              original.issuer !== honor.issuer ||
              original.programeDate !== honor.programeDate ||
              original.description !== honor.description;

            return {
              ...baseHonor,
              _id: honor._id,
              type: isModified ? "update" : "update",
            };
          }
        });

      const deletedHonors = originalHonors
        .filter((original) => {
          const stillExists = honors.find(
            (h) => h._id === original._id && !h.isDeleted
          );
          return !stillExists;
        })
        .map((honor) => ({
          _id: honor._id,
          type: "delete",
        }));

      const allHonors = [...processedHonors, ...deletedHonors];

      // prepare final data to send
      const formData = {
        ...data,
        sLink: cleanSLink, // ✅ only filled links
        service: filteredServices,
        employeesId: selectedEmployees,
        honors: allHonors,
      };

      await updateCompany(formData);
      toast.success("Company updated successfully!");
      router.push("/elevator-video-pitch");
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Failed to update company");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading company data...</div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="container mx-auto px-2">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-16">
            <h1 className="text-[48px] font-bold text-[#131313] mb-2 text-center">
              Edit Company/Business Account
            </h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Company Banner
                </Label>
                <BannerUpload
                  onFileSelect={handleBannerSelect}
                  previewUrl={bannerPreview}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">
                    Company Logo
                  </Label>
                  <LogoUpload
                    onFileSelect={setLogoFile}
                    previewUrl={
                      logoFile
                        ? URL.createObjectURL(logoFile)
                        : companyData?.data?.companies?.[0]?.clogo || null
                    }
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <FormField
                    control={form.control}
                    name="aboutUs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          About Us*
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Write about your company..."
                          />
                        </FormControl>
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
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-medium text-gray-900">
                          Country*
                        </FormLabel>
                        <Popover
                          open={countryOpen}
                          onOpenChange={setCountryOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={countryOpen}
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || "Select a country"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search country..." />
                              <CommandList>
                                <CommandEmpty>
                                  {isLoadingCountries
                                    ? "Loading countries..."
                                    : "No country found."}
                                </CommandEmpty>
                                <CommandGroup>
                                  {countriesData?.map((country: Country) => (
                                    <CommandItem
                                      key={country.country}
                                      value={country.country}
                                      onSelect={(value) => {
                                        field.onChange(value);
                                        setSelectedCountry(value);
                                        form.setValue("city", "");
                                        setCountryOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === country.country
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {country.country}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-medium text-gray-900">
                          City*
                        </FormLabel>
                        <Popover open={cityOpen} onOpenChange={setCityOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={cityOpen}
                                disabled={!selectedCountry}
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || "Select a city"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search city..." />
                              <CommandList>
                                <CommandEmpty>
                                  {isLoadingCities
                                    ? "Loading cities..."
                                    : "No city found."}
                                </CommandEmpty>
                                <CommandGroup>
                                  {citiesData?.map((city: string) => (
                                    <CommandItem
                                      key={city}
                                      value={city}
                                      onSelect={(value) => {
                                        field.onChange(value);
                                        setCityOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === city
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {city}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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
                            disabled
                            {...field}
                            type="email"
                            placeholder="Enter Your Email Address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <SocialLinksSection form={form} />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900">
                        Industry*
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || "Select industry"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search industry..." />
                            <CommandList>
                              <CommandEmpty>
                                {isLoadingIndustries
                                  ? "Loading industries..."
                                  : "No industry found."}
                              </CommandEmpty>
                              <CommandGroup>
                                {industryOptions.map((industry) => (
                                  <CommandItem
                                    key={industry.value}
                                    value={industry.value}
                                    onSelect={(value) => {
                                      field.onChange(value);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === industry.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {industry.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Services
                  </h3>
                </div>

                <div className="space-y-3">
                  {services.map((service, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          value={service}
                          onChange={(e) => updateService(index, e.target.value)}
                          placeholder={`Service ${index + 1}`}
                        />
                      </div>
                      {services.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addService}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  Add more
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  View your company recruiters
                </h3>
                <EmployeeSelector
                  selectedEmployees={selectedEmployees}
                  onEmployeesChange={setSelectedEmployees}
                  companyUserId={companyId}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Company Awards and Honours
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addHonor}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    Add Honor
                  </Button>
                </div>

                <div className="space-y-4">
                  {honors
                    .filter((honor) => !honor.isDeleted)
                    .map((honor) => (
                      <div
                        key={honor.id}
                        className={`space-y-3 ${
                          honor.isNew ? "border-l-4 border-green-500 pl-4" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            Honor/Award
                            {honor.isNew && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                New
                              </span>
                            )}
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHonor(honor.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Award Title
                            </Label>
                            <Input
                              value={honor.title}
                              onChange={(e) =>
                                updateHonor(honor.id, "title", e.target.value)
                              }
                              placeholder="Award/Honor Title"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Award Issuer
                              </Label>
                              <Input
                                value={honor.issuer}
                                onChange={(e) =>
                                  updateHonor(
                                    honor.id,
                                    "issuer",
                                    e.target.value
                                  )
                                }
                                placeholder="Award/Honor Issuer"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Award Date
                              </Label>
                              <CustomDateInput
                                value={honor.programeDate}
                                onChange={(value) =>
                                  updateHonor(honor.id, "programeDate", value)
                                }
                                placeholder="MM/YYYY"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Award Short Description
                            </Label>
                            <Textarea
                              value={honor.description}
                              onChange={(e) =>
                                updateHonor(
                                  honor.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Description of the award/honor"
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-blue-700 text-white py-3 text-lg font-medium"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Company"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="px-8 py-3 bg-transparent"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default EditCompanyPage;
