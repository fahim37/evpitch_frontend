"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileUpload } from "@/components/company/file-upload";
import { EmployeeSelector } from "@/components/company/employee-selector";
import { DynamicInputList } from "@/components/company/dynamic-input-list";
import { createCompany, uploadElevatorPitch } from "@/lib/api-service";

const formSchema = z.object({
  cname: z.string().min(1, "Company name is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  zipcode: z.string(),
  cemail: z.string().email("Invalid email address"),
  aboutUs: z.string().min(1, "About us is required"),
  industry: z.string().min(1, "Industry is required"),
  linkedin: z.string().optional().or(z.literal("")),
  twitter: z.string().optional().or(z.literal("")),
  upwork: z.string().optional().or(z.literal("")),
  otherBusiness: z.string().optional().or(z.literal("")),
  otherProfessional: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateCompanyPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [websites, setWebsites] = useState<string[]>([""]);
  const [services, setServices] = useState<string[]>([""]);
  const [awards, setAwards] = useState([
    {
      title: "",
      issuer: "",
      issueDate: "",
      description: "",
    },
  ]);

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      toast.success("Company created successfully!");
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create company");
    },
  });

  // Upload elevator pitch mutation
  const uploadElevatorPitchMutation = useMutation({
    mutationFn: uploadElevatorPitch,
    onSuccess: () => {
      toast.success(
        "Upload completed! We’re processing your video—check back shortly."
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload video");
    },
  });

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
      linkedin: "",
      twitter: "",
      upwork: "",
      otherBusiness: "",
      otherProfessional: "",
    },
  });

  const addAward = () => {
    setAwards([
      ...awards,
      { title: "", issuer: "", issueDate: "", description: "" },
    ]);
  };

  const removeAward = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index));
  };

  const updateAward = (index: number, field: string, value: string) => {
    const newAwards = [...awards];
    newAwards[index] = { ...newAwards[index], [field]: value };
    setAwards(newAwards);
  };

  const onSubmit = async (data: FormData) => {
    if (!session?.user?.id) {
      toast.error("Please log in to create a company.");
      return;
    }

    const formData = new FormData();

    // Add logo file
    if (logoFile) {
      formData.append("clogo", logoFile);
    }

    // Add basic company data
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });

    // Add all links (websites + social media)
    const allLinks = [
      ...websites.filter(Boolean),
      data.linkedin,
      data.twitter,
      data.upwork,
      data.otherBusiness,
      data.otherProfessional,
    ].filter(Boolean);

    formData.append("links", JSON.stringify(allLinks));

    // Add services
    const filteredServices = services.filter((service) => service.trim());
    formData.append("service", JSON.stringify(filteredServices));

    // Add employees
    formData.append("employeesId", JSON.stringify(selectedEmployees));

    // Add awards
    const filteredAwards = awards.filter((award) => award.title.trim());
    formData.append("AwardsAndHonors", JSON.stringify(filteredAwards));

    try {
      await createCompanyMutation.mutateAsync(formData);

      // Upload elevator pitch if provided
      if (elevatorPitchFile && session.user.id) {
        await uploadElevatorPitchMutation.mutateAsync({
          videoFile: elevatorPitchFile,
          userId: session.user.id,
        });
      }
    } catch (error) {
      console.error("Error creating company:", error);
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
          {/* Elevator Pitch Upload */}
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
              <Button
                type="button"
                className="bg-primary hover:bg-blue-700 text-white px-6"
              >
                Upload/Change Elevator Video Pitch©
              </Button>
            </div>

            <FileUpload
              onFileSelect={setElevatorPitchFile}
              accept="video/*"
              maxSize={32 * 1024 * 1024}
              variant="dark"
            ></FileUpload>
          </div>

          {/* Company Logo and About */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Company Logo
              </Label>
              <div className="aspect-square">
                <FileUpload
                  onFileSelect={setLogoFile}
                  accept="image/*"
                  className="h-full"
                >
                  <div className="w-full h-full bg-primary text-white flex items-center justify-center text-sm font-medium rounded-lg">
                    photo/recruiter logo
                  </div>
                </FileUpload>
              </div>
            </div>

            <div className="md:col-span-3 space-y-2">
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
                        {...field}
                        placeholder="Write your description here (400 words)"
                        className="min-h-[140px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Company Details */}
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
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Country*
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="usa">USA</SelectItem>
                        <SelectItem value="canada">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="germany">Germany</SelectItem>
                        <SelectItem value="france">France</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      City*
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new-york">New York</SelectItem>
                        <SelectItem value="los-angeles">Los Angeles</SelectItem>
                        <SelectItem value="chicago">Chicago</SelectItem>
                        <SelectItem value="houston">Houston</SelectItem>
                      </SelectContent>
                    </Select>
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

           
            </div>
          </div>

          {/* Website Links */}
          <DynamicInputList
            label="Website"
            placeholder="Enter Your Website Url"
            values={websites}
            onChange={setWebsites}
            buttonText="Add More"
          />

          {/* Social Links */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      LinkedIn
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter Your Website Url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Twitter
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter Your Website Url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="upwork"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Upwork
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter Your Website Url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="otherBusiness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Other Business
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter Your Website Url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="otherProfessional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Other Professional Website*
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter Your Website Address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Industry*
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Services */}
          <DynamicInputList
            label="Services*"
            placeholder="Add Here"
            values={services}
            onChange={setServices}
          />

          {/* Employee Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              View your company employees
            </h3>
            <EmployeeSelector
              selectedEmployees={selectedEmployees}
              onEmployeesChange={setSelectedEmployees}
            />
          </div>

          {/* Awards and Honours */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Company Awards and Honours
            </h3>
            {awards.map((award, index) => (
              <div
                key={index}
                className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">
                    Award {index + 1}
                  </h4>
                  {awards.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAward(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <Input
                  placeholder="Award Title"
                  value={award.title}
                  onChange={(e) => updateAward(index, "title", e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Issuer"
                    value={award.issuer}
                    onChange={(e) =>
                      updateAward(index, "issuer", e.target.value)
                    }
                  />

                  <Select
                    value={award.issueDate}
                    onValueChange={(value) =>
                      updateAward(index, "issueDate", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add a Month & Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-01">January 2024</SelectItem>
                      <SelectItem value="2024-02">February 2024</SelectItem>
                      <SelectItem value="2024-03">March 2024</SelectItem>
                      <SelectItem value="2023-12">December 2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  placeholder="Award Short Description"
                  value={award.description}
                  onChange={(e) =>
                    updateAward(index, "description", e.target.value)
                  }
                  className="resize-none"
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addAward}
              className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
            >
              Add More
            </Button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-blue-700 text-white py-3 text-lg font-medium"
            disabled={createCompanyMutation.isPending}
          >
            {createCompanyMutation.isPending ? "Creating..." : "Save"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
