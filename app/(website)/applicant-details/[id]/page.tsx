"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  MapPin,
  ExternalLink,
  Download,
  Mail,
  PhoneOutgoing,
} from "lucide-react";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";

import { toast } from "sonner";

import { VideoPlayer } from "@/components/company/video-player";
import Image from "next/image";
import { getResumeDownloadUrl } from "@/lib/api-service";

interface Resume {
  _id: string;
  userId: string;
  photo?: string;
  aboutUs?: string;
  title: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  email?: string;
  phoneNumber?: string;
  skills?: string[];
  sLink?: Array<{ label: string; url: string; _id: string }>;
  createdAt?: string;
  updatedAt?: string;
}

interface Experience {
  _id: string;
  userId: string;
  employer?: string;
  company?: string;
  position?: string;
  jobTitle?: string;
  startDate?: string;
  endDate?: string;
  country?: string;
  city?: string;
  zip?: string;
  jobDescription?: string;
  jobCategory?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Education {
  _id: string;
  userId: string;
  degree?: string;
  fieldOfStudy?: string;
  createdAt?: string;
  updatedAt?: string;
  instituteName?: string;
}

interface Award {
  _id: string;
  userId: string;
  title?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ElevatorPitch {
  _id: string;
  userId: string;
  videoUrl?: string;
  description?: string;
}

interface ApplicantData {
  resume?: Resume;
  experiences?: Experience[];
  education?: Education[];
  awardsAndHonors?: Award[];
  elevatorPitch?: ElevatorPitch[];
}

interface ResumeFile {
  filename: string;
  url: string;
  uploadedAt: string;
  _id: string;
}

interface ResumeData {
  _id: string;
  userId: string;
  file: ResumeFile[];
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ResumeApiResponse {
  success: boolean;
  message: string;
  data: ResumeData[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: ApplicantData;
}

const degreeLabels: Record<string, string> = {
  bsc: "BSc.",
  btech: "B.Tech.",
  ba: "B.A",
  bed: "B.Ed.",
  mba: "M.B.A.",
  msc: "MSc.",
  mphil: "M.Phil.",
  phd: "Ph.D",
};

// Helper function to validate URLs
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

// Helper function to normalize URLs by adding protocol if missing
const normalizeUrl = (url: unknown): string => {
  if (typeof url !== "string" || !url) {
    return "";
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

export default function ApplicantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = session?.user?.role;

  const MyId = session?.user.id;
  const token = session?.accessToken;
  const applicationId = params.id as string;
  const resumeId = searchParams.get("resumeId");

  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const fetchApplicantDetails = async (): Promise<ApplicantData> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/create-resume/get-resume/${applicationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch applicant details");
    }

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch applicant details");
    }

    const apiData = result.data;

    // Map social links to preserve the full object structure with normalized URLs
    const validLinks = (apiData.resume?.sLink || [])
      .filter(
        (link): link is { label: string; url: string; _id: string } =>
          !!link &&
          typeof link === "object" &&
          "url" in link &&
          "label" in link &&
          "_id" in link
      )
      .map((link) => ({
        ...link,
        url: normalizeUrl(link.url), // Normalize the URL while keeping other properties
      }))
      .filter((link) => isValidUrl(link.url));

    return {
      resume: apiData.resume
        ? {
            _id: apiData.resume._id,
            userId: apiData.resume.userId,
            photo: apiData.resume.photo || "/placeholder.svg",
            aboutUs: apiData.resume.aboutUs,
            title: apiData.resume.title,
            firstName: apiData.resume.firstName,
            lastName: apiData.resume.lastName,
            country: apiData.resume.country,
            city: apiData.resume.city,
            email: apiData.resume.email,
            phoneNumber: apiData.resume.phoneNumber,
            skills: apiData.resume.skills,
            sLink: validLinks, // Assign the correctly typed array
            createdAt: apiData.resume.createdAt,
            updatedAt: apiData.resume.updatedAt,
          }
        : undefined,
      experiences: apiData.experiences || [],
      education: apiData.education || [],
      awardsAndHonors: apiData.awardsAndHonors || [],
      elevatorPitch: apiData.elevatorPitch || [],
    };
  };

  const {
    data: applicantData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["applicant-details", applicationId],
    queryFn: fetchApplicantDetails,
    enabled: !!token && !!applicationId,
  });

  const userId = applicantData?.resume?.userId;

  const fetchResumeData = async () => {
    if (!resumeId || !userId || !token) return;

    try {
      setResumeLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch resume data");
      }

      const result: ResumeApiResponse = await response.json();

      if (result.success) {
        const matchingResume =
          result.data.find((r) => String(r._id) === String(resumeId)) ||
          result.data[0] ||
          null;

        setResumeData(matchingResume);
      } else {
        setResumeData(null);
      }
    } catch (error) {
      console.error("Error fetching resume data:", error);
    } finally {
      setResumeLoading(false);
    }
  };

  useEffect(() => {
    if (resumeId && userId && token) {
      console.log("kkkk259526");
      fetchResumeData();
    }
  }, [resumeId, userId, token]);

  const handleResumeDownload = async () => {
    const targetResumeId = resumeId || resumeData?._id;
    if (!targetResumeId) {
      toast.error("Resume not available");
      return;
    }

    setIsDownloadingResume(true);
    try {
      const result = await getResumeDownloadUrl(targetResumeId);
      const downloadUrl = result?.data?.url;
      const filename =
        result?.data?.filename ||
        resumeData?.file?.[0]?.filename ||
        "resume.pdf";

      if (!downloadUrl) {
        toast.error("Resume link is unavailable");
        return;
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to download resume");
    } finally {
      setIsDownloadingResume(false);
    }
  };

  // Function to handle message room creation
  const handleCreateMessageRoom = async () => {
    if (!resume?.userId || !token) {
      toast.error("Missing user or session. Please sign in again.");
      console.error("Missing userId or token");
      return;
    }

    try {
      setCreatingRoom(true);

      // Determine the ID field based on role
      const idField =
        role === "recruiter" ? { recruiterId: MyId } : { companyId: MyId };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/message-room/create-message-room`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: resume.userId, // applicant user
            ...idField, // current recruiter
          }),
        }
      );

      // Try to read JSON even when response is not ok
      let result: any = null;
      try {
        result = await response.json();
      } catch {
        /* no-op */
      }

      // If API says the room already exists, show toast + redirect gracefully
      if (!response.ok) {
        const message = (result?.message || "").toLowerCase();

        if (message.includes("message room already exists")) {
          toast.info("Message room already exists. Opening it…");
          // If API doesn’t return roomId, fall back to userId navigation
          const existingRoomId =
            result?.data?.roomId || result?.data?.existingRoomId;
          if (existingRoomId) {
            router.push(`/messages?roomId=${existingRoomId}`);
          } else {
            router.push(`/messages?userId=${resume.userId}`);
          }
          return;
        }

        // Generic error path
        toast.error(result?.message || "Failed to create message room.");
        console.error("Failed to create message room:", result);
        return;
      }

      // Success path
      const roomId = result?.data?.roomId;
      toast.success("Message room created.");
      if (roomId) {
        router.push(`/messages?roomId=${roomId}`);
      } else {
        // Fallback: open by userId if roomId isn’t provided
        router.push(`/messages?userId=${resume.userId}`);
      }
    } catch (error) {
      toast.error("Something went wrong creating the message room.");
      console.error("Error creating message room:", error);
    } finally {
      setCreatingRoom(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Present";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  // const getYearsOfExperience = (experiences: Experience[] = []) => {
  //   if (!experiences.length) return "0+ years";

  //   const totalMonths = experiences.reduce((total, exp) => {
  //     if (!exp.startDate) return total;
  //     const start = new Date(exp.startDate);
  //     const end = exp.endDate ? new Date(exp.endDate) : new Date();
  //     const months =
  //       (end.getFullYear() - start.getFullYear()) * 12 +
  //       (end.getMonth() - start.getMonth());
  //     return total + Math.max(0, months);
  //   }, 0);

  //   const years = Math.floor(totalMonths / 12);
  //   return `${years}+ years`;
  // };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="">
          <Skeleton className="h-8 w-48 mb-6" />
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-48 mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !applicantData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-600 mb-4">
                  Error: {(error as Error)?.message || "No data found"}
                </p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const {
    resume = {} as Resume,
    experiences = [],
    education = [],
    awardsAndHonors = [],
    elevatorPitch = [],
  } = applicantData;

  const hasResumeData =
    resume.firstName || resume.lastName || resume.email || resume.phoneNumber;

  if (!hasResumeData && experiences.length === 0 && education.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Applicants
          </Button>
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  No detailed profile information is available for this
                  applicant.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Applicants
        </Button>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="md:flex  gap-6 ">
              <div className="h-[170px] w-[170px] overflow-hidden">
                <Image
                  src={resume?.photo || "/placeholder.svg"}
                  alt={`${resume?.firstName ?? ""} ${resume?.lastName ?? ""}`}
                  width={170}
                  height={170}
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <div className="md:flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {resume.firstName} {resume.lastName}
                    </h1>
                    <div className="space-y-1 text-gray-600 mb-4">
                      {resume.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{resume.country}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    className="bg-primary hover:bg-blue-700"
                    onClick={handleResumeDownload}
                    disabled={!resumeId || resumeLoading || isDownloadingResume}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {resumeLoading
                      ? "Loading..."
                      : isDownloadingResume
                      ? "Downloading..."
                      : "Resume"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {resume.aboutUs && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed list-item list-none"
                dangerouslySetInnerHTML={{
                  __html: resume.aboutUs
                    ? DOMPurify.sanitize(resume.aboutUs)
                    : "",
                }}
              />
            </CardContent>
          </Card>
        )}

        {elevatorPitch && elevatorPitch.length > 0 && (
          <div className="rounded-lg py-6 bg-gray-50">
            <h2 className="text-xl md:text-center font-semibold mb-4 text-gray-900">
              Elevator Video Pitch©
            </h2>
            <VideoPlayer
              pitchId={elevatorPitch[0]._id}
              className="w-full mx-auto"
            />
          </div>
        )}

        {experiences[0]?.company && experiences[0]?.position && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {experiences.map((exp) => (
                  <div
                    key={exp._id}
                    className="border-l-2 pl-4 border-gray-200"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {exp.position || "Unknown Position"}
                        </h3>
                        {/* <p className="text-gray-600">
                          {exp.employer || "Unknown Employer"}
                        </p> */}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        {exp.company || "Unknown Employer"}
                      </p>
                    </div>
                    {exp.country && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {[exp.city, exp.country].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                    {exp.jobDescription && (
                      <p className="mt-2 text-gray-700">{exp.jobDescription}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {resume.skills && resume.skills.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {awardsAndHonors.length > 0 && awardsAndHonors[0].title && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Awards & Honors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {awardsAndHonors.map((award) => (
                  <div key={award._id}>
                    <h3 className="font-semibold">{award.title}</h3>
                    {award.description && (
                      <p className="text-gray-700 mt-1">{award.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {resume.sLink && resume.sLink.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {resume.sLink.map((link, index) => {
                  const normalizedLink = normalizeUrl(link.url);
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() =>
                        normalizedLink && window.open(normalizedLink, "_blank")
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {isValidUrl(normalizedLink)
                        ? new URL(normalizedLink).hostname
                        : link.label || "Invalid Link"}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-center gap-4 mt-6">
          <div>
            <Button
              variant="outline"
              className="bg-[#2B7FD0] text-white"
              onClick={handleCreateMessageRoom}
              disabled={creatingRoom}
            >
              {creatingRoom ? "Opening…" : "Message"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
