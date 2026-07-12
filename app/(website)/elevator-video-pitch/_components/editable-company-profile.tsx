"use client";

import type React from "react";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialIcon } from "@/components/company/social-icon";
import { VideoPlayer } from "@/components/company/video-player";
import {
  fetchCompanyDetails,
  fetchCompanyJobs,
  editCompanyAccount,
} from "@/lib/api-service";
import {
  MapPin,
  Users,
  Calendar,
  ExternalLink,
  Archive,
  Edit,
  Save,
  X,
  Camera,
} from "lucide-react";
import { toast } from "sonner";

type Company = {
  _id: string;
  userId: string;
  cname: string;
  aboutUs: string;
  industry: string;
  city: string;
  country: string;
  clogo?: string;
  links: string[];
  service: string[];
  employeesId?: string[];
};

export default function EditableCompanyProfile({
  userId,
  onSave,
}: {
  userId?: string;
  onSave?: (updatedCompany: Company) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCompany, setEditedCompany] = useState<Company | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["company", userId],
    queryFn: () => fetchCompanyDetails(userId as string),
    enabled: !!userId,
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ["company-jobs"],
    queryFn: fetchCompanyJobs,
  });

  if (isLoadingCompany) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!companyData?.companies?.[0]) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Company not found
      </div>
    );
  }

  const company = isEditing
    ? editedCompany || companyData.companies[0]
    : companyData.companies[0];
  const honors = companyData.honors || [];

  const handleEdit = () => {
    setEditedCompany({ ...companyData.companies[0] });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedCompany || !userId) return;

    setIsSaving(true);
    try {
      await editCompanyAccount(company._id, editedCompany);
      queryClient.invalidateQueries({ queryKey: ["company"] });
      onSave?.(editedCompany);
      setIsEditing(false);
      setLogoPreview(null);
    } catch (error) {
      console.error("Failed to save company profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCompany(null);
    setIsEditing(false);
    setLogoPreview(null);
  };

  const updateCompanyField = (field: keyof Company, value: any) => {
    if (editedCompany) {
      setEditedCompany({
        ...editedCompany,
        [field]: value,
      });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSizeInBytes = 9 * 1024 * 1024; // 10 MB

    if (file.size > maxSizeInBytes) {
      toast.error("File size exceeds 10 MB. Please select a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      updateCompanyField("clogo", result);
    };
    reader.readAsDataURL(file);
  };

  const links = company.links || [];
  const services = company.service || [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-white">
      {/* Header Section */}
      <div className="bg-gray-100 rounded-lg p-8">
        <div className="flex items-start gap-6">
          <div className="relative w-20 h-20 bg-gray-600 rounded-lg flex-shrink-0 group">
            {logoPreview || company.clogo ? (
              <img
                src={logoPreview || company.clogo || "/placeholder.svg"}
                alt={company.cname}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-600 rounded-lg" />
            )}

            {isEditing && (
              <>
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="logo-upload">Company Logo</Label>
                  <div className="mt-2">
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Upload a new logo for your company
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cname">Company Name</Label>
                  <Input
                    id="cname"
                    value={editedCompany?.cname || ""}
                    onChange={(e) =>
                      updateCompanyField("cname", e.target.value)
                    }
                    className="text-2xl font-bold"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={editedCompany?.industry || ""}
                    onChange={(e) =>
                      updateCompanyField("industry", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editedCompany?.city || ""}
                      onChange={(e) =>
                        updateCompanyField("city", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={editedCompany?.country || ""}
                      onChange={(e) =>
                        updateCompanyField("country", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="links">Website Links (comma separated)</Label>
                  <Input
                    id="links"
                    value={editedCompany?.links?.join(", ") || ""}
                    onChange={(e) =>
                      updateCompanyField(
                        "links",
                        e.target.value.split(", ").filter(Boolean)
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="services">Services (comma separated)</Label>
                  <Input
                    id="services"
                    value={editedCompany?.service?.join(", ") || ""}
                    onChange={(e) =>
                      updateCompanyField(
                        "service",
                        e.target.value.split(", ").filter(Boolean)
                      )
                    }
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-1 text-gray-900">
                  {company.cname}
                </h1>
                <p className="text-gray-600 mb-4 text-sm">{company.industry}</p>

                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {company.city}, {company.country}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {company.employeesId?.length || 0} employees
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>Contact</span>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex gap-2">
                  {links.map((link: string, index: number) => (
                    <SocialIcon key={index} url={link} />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="text-right">
            {!isEditing ? (
              <>
                <p className="text-sm text-gray-600 mb-2 font-medium">
                  All job posts free until January 2027
                </p>
                <p className="text-xs text-gray-500 mb-4 max-w-xs">
                  Easily post your company job openings and reach the right
                  talent fast. Get quality applications in no time.
                </p>
                <div className="space-x-5 flex items-center">
                  <Button className="bg-primary hover:bg-blue-700 text-white px-6 block">
                    Post a Job
                  </Button>
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="px-6 flex items-center gap-2 bg-transparent"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 flex items-center gap-2"
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="px-6 flex items-center gap-2 bg-transparent"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Jobs */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Company Jobs
        </h2>
        {isLoadingJobs ? (
          <div>Loading jobs...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <Card key={job._id} className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-lg">
                          {job.title.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">
                          {job.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{company.cname}</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </p>
                    <p className="font-medium text-gray-900">
                      {job.salaryRange}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {job.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1 h-7 bg-transparent"
                      >
                        View Job
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1 h-7 flex items-center gap-1 bg-transparent"
                      >
                        <Archive className="h-3 w-3" />
                        Archive Job
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-xs px-4 py-1 h-7"
                    >
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Elevator Pitch */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 text-left mb-6">
          Elevator Video Pitch©
        </h2>
        <div className="bg-gray-100 rounded-lg p-6">
          <VideoPlayer
            pitchId="687623daea00f0d9b621c53e"
            className="w-full mx-auto"
          />
        </div>
      </div>

      {/* About Us */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">About Us</h2>
        {isEditing ? (
          <div>
            <Label htmlFor="aboutUs">About Us</Label>
            <Textarea
              id="aboutUs"
              value={editedCompany?.aboutUs || ""}
              onChange={(e) => updateCompanyField("aboutUs", e.target.value)}
              rows={6}
              className="mt-2"
            />
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed text-sm">
            {company.aboutUs}
          </p>
        )}
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Website</h3>
            <a
              href={links[0]}
              className="text-blue-600 hover:underline text-sm"
            >
              {links[0] || "Not provided"}
            </a>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Industry</h3>
            <p className="text-gray-700 text-sm">{company.industry}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Company size</h3>
            <p className="text-gray-700 text-sm">
              {company.employeesId?.length || 0} employees
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {services.map((service: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Locations</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">
                  {company.city}, {company.country}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600 text-xs"
                >
                  Get Direction
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">
                  {company.city}, {company.country}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600 text-xs"
                >
                  Get Direction
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">
                  {company.city}, {company.country}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600 text-xs"
                >
                  Get Direction
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employees */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Employees at {company.cname}
        </h2>
        <div className="space-y-4">
          {company.employeesId?.map((employeeId: string, index: number) => (
            <div
              key={employeeId}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
            >
              <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">David Usman</h4>
                <p className="text-sm text-gray-600">
                  Product Designer | Storyteller | Problem Solver
                </p>
              </div>
            </div>
          ))}
          {(!company.employeesId || company.employeesId.length === 0) && (
            <p className="text-gray-500">No employees added yet.</p>
          )}
          <div className="text-center pt-4">
            <Button variant="link" className="text-blue-600">
              See All
            </Button>
          </div>
        </div>
      </div>

      {/* Awards and Honors */}
      {honors.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Awards and Honors
          </h2>
          <div className="space-y-4">
            {honors.map(
              (honor: {
                _id: string;
                userId: string;
                title: string;
                programeName: string;
                programeDate: string;
                description: string;
              }) => (
                <Card key={honor._id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900">
                      {honor.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {honor.programeName}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {new Date(honor.programeDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-700">{honor.description}</p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
