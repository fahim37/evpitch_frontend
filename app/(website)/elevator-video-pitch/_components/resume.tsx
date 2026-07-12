"use client";

import type React from "react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  MapPin,
  GraduationCap,
  Briefcase,
  AwardIcon,
  SquarePen,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { VideoPlayer } from "@/components/company/video-player";
import {
  deleteElevatorPitchVideo,
  uploadElevatorPitch,
} from "@/lib/api-service";
import { ElevatorPitchUpload } from "./elevator-pitch-upload";
import SocialLinks from "./SocialLinks";
import { VideoProcessingCard } from "@/components/VideoProcessingCard";

interface ResumeResponse {
  success: boolean;
  message: string;
  data: {
    resume: Resume;
    website: string;
    experiences: Experience[];
    education: Education[];
    awardsAndHonors: ResumeAward[];
    elevatorPitch: any[];
  };
}

interface Resume {
  _id: string;
  aboutUs: string;
  userId: string;
  type: string;
  photo: string | null;
  banner: string | null;
  title: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  zipCode: string;
  email: string;
  skills: string[];
  sLink: { label: string; url: string; _id: string }[];
  certifications: string[];
  languages: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  immediatelyAvailable: boolean;
}

interface Experience {
  _id: string;
  userId: string;
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  country?: string;
  city?: string;
  zip?: string;
  jobDescription?: string;
  jobCategory?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Education {
  _id: string;
  userId: string;
  instituteName: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  graduationDate?: string;
  city?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ResumeAward {
  _id: string;
  userId: string;
  title: string;
  programeDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface MyResumeProps {
  resume: ResumeResponse["data"];
  onEdit: () => void;
}

export default function MyResume({ resume, onEdit }: MyResumeProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const token = session?.accessToken;

  const processingInfo = resume?.elevatorPitch?.[0]?.processing;
  const isProcessing = processingInfo?.state === "processing";

  const [elevatorPitchFile, setElevatorPitchFile] = useState<File | null>(null);
  const [isElevatorPitchUploaded, setIsElevatorPitchUploaded] =
    useState<boolean>(!!resume.elevatorPitch[0]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const deleteElevatorPitchMutation = useMutation({
    mutationFn: deleteElevatorPitchVideo,
    onSuccess: () => {
      toast.success("Elevator pitch deleted successfully!");
      setIsElevatorPitchUploaded(false);
      setElevatorPitchFile(null);
      setIsDeleteModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete elevator pitch.");
      console.error("Error deleting elevator pitch:", error);
    },
  });

  const uploadElevatorPitchMutation = useMutation({
    mutationFn: uploadElevatorPitch,
    onSuccess: () => {
      toast.success(
        "Video processing in the background - please refresh your browser shortly",
      );
      setIsElevatorPitchUploaded(true);
      setElevatorPitchFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload video");
      setIsElevatorPitchUploaded(false);
    },
  });

  const handleElevatorPitchUpload = async () => {
    if (elevatorPitchFile && userId) {
      try {
        await uploadElevatorPitchMutation.mutateAsync({
          videoFile: elevatorPitchFile,
          userId,
        });
      } catch (error) {
        // Error toast is handled in mutation onError
      }
    } else {
      toast.error("Please select a video file to upload");
    }
  };

  const handleDeleteElevatorPitch = async () => {
    if (userId && resume.elevatorPitch[0]) {
      try {
        await deleteElevatorPitchMutation.mutateAsync(userId);
      } catch (error) {
        // Error toast is handled in mutation onError
      }
    }
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  if (!resume || !resume.resume) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No resume data available</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Present";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <main className="min-h-screen">
      <div className="lg:container lg:mx-auto lg:px-6">
        <div className="w-full h-auto">
          {resume.resume.banner ? (
            <Image
              src={resume.resume.banner}
              alt="Resume Header Background"
              width={1200}
              height={300}
              className="w-full h-auto  object-cover"
            />
          ) : (
            <div className="w-full h-[150px] md:h-[300px] lg:h-[400px] bg-gray-200" />
          )}
        </div>
        <div className="container mx-auto border-0 mb-16">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row border-b-2 mt-[-10px] md:mt-[-20px] lg:mt-[-30px] pb-4 gap-6 sm:px-6">
              <div className="lg:w-1/3 w-full">
                <div className="mb-6">
                  <div className="w-[120px] h-[120px] md:h-[170px] md:w-[170px] object-cover rounded-md bg-gray-300 ring-2 ring-background shadow-md overflow-hidden bg-muted mb-4">
                    {resume.resume.photo ? (
                      <Image
                        src={resume.resume.photo}
                        alt={`${resume.resume.firstName} ${resume.resume.lastName}`}
                        height={500}
                        width={500}
                        className="w-[120px] h-[120px] md:h-[170px] md:w-[170px] object-cover object-top"
                      />
                    ) : (
                      <div className="w-[120px] h-[120px] md:h-[170px] md:w-[170px] object-cover bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                        {resume.resume.firstName?.[0] || "U"}
                        {resume.resume.lastName?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {resume.resume.title
                      ? `${resume.resume.title
                          .charAt(0)
                          .toUpperCase()}${resume.resume.title.slice(1)} `
                      : ""}
                    {`${resume.resume.firstName
                      .charAt(0)
                      .toUpperCase()}${resume.resume.firstName.slice(1)} `}
                    {`${resume.resume.lastName
                      .charAt(0)
                      .toUpperCase()}${resume.resume.lastName.slice(1)}`}
                  </h2>

                  <div className="mt-2 space-x-2">
                    <SocialLinks sLink={resume.resume.sLink} />
                  </div>
                </div>
              </div>

              <div className="lg:w-2/3 w-full space-y-6 lg:mt-[50px]">
                <div className="space-y-4">
                  <div className="flex justify-between border-b-2 pb-2">
                    <h3 className="font-semibold text-gray-800 mb-3 text-2xl">
                      Contact Info
                    </h3>
                    <div className="">
                      <div className="">
                        <Button
                          onClick={onEdit}
                          className="bg-[#3b82f6] hover:bg-[#3b82f6] text-lg"
                        >
                          <SquarePen className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-base">Location</p>
                      <p className="text-gray-600">
                        {resume.resume.city && `${resume.resume.city}, `}
                        {resume.resume.country}
                        {resume.resume.zipCode && `, ${resume.resume.zipCode}`}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-base">Email</p>
                      <p className="text-gray-600">{resume.resume.email}</p>
                    </div>
                    {resume.resume.immediatelyAvailable && (
                      <div>
                        <p className="font-semibold text-base">Availibility</p>
                        <p className="text-gray-600">Immediately Available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Elevator Pitch */}
            <div className="lg:pb-12 pb-5 pt-6">
              <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 text-left mb-6">
                Elevator Video Pitch©
              </h2>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm md:text-lg lg:text-xl">
                      Upload or view a short video introducing yourself.
                    </CardTitle>
                    {isElevatorPitchUploaded && resume.elevatorPitch[0] && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Options"
                            className="bg-gray-100 hover:bg-gray-200"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="">
                          <DropdownMenuItem
                            onClick={openDeleteModal}
                            disabled={deleteElevatorPitchMutation.isPending}
                            className="text-red-600 focus:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isProcessing ? (
                    <VideoProcessingCard
                      startedAt={processingInfo?.startedAt}
                      onRetry={() => window.location.reload()}
                      className="w-full"
                    />
                  ) : isElevatorPitchUploaded && resume.elevatorPitch[0] ? (
                    <VideoPlayer
                      pitchId={resume.elevatorPitch[0]._id}
                      className="w-full mx-auto"
                    />
                  ) : (
                    <>
                      <ElevatorPitchUpload
                        onFileSelect={setElevatorPitchFile}
                        selectedFile={elevatorPitchFile}
                      />
                      <Button
                        type="button"
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleElevatorPitchUpload}
                        disabled={
                          uploadElevatorPitchMutation.isPending ||
                          !elevatorPitchFile
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

                      {isElevatorPitchUploaded && (
                        <p className="mt-2 text-sm text-green-600">
                          Elevator pitch upload finished! Processing continues
                          in the background. Please refresh the page in a few
                          seconds.
                        </p>
                      )}

                      {!isElevatorPitchUploaded && !elevatorPitchFile && (
                        <p className="mt-2 text-sm text-gray-600">
                          No pitch available
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                  <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to delete your elevator pitch? This
                    action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={closeDeleteModal}
                      className="px-4 py-2"
                    >
                      No
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteElevatorPitch}
                      disabled={deleteElevatorPitchMutation.isPending}
                      className="px-4 py-2"
                    >
                      Yes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                About Me
              </h3>
              <p className="list-item !text-gray-600 leading-relaxed list-none">
                {resume.resume.aboutUs}
              </p>
            </section>

            <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {resume.resume.skills?.map((skill, index) => (
                  <Badge
                    key={index}
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>

            {resume.resume.certifications?.length > 0 && (
              <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
                <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resume.resume.certifications?.map((cert, index) => (
                    <Badge
                      key={index}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      {cert}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {resume.resume.languages?.length > 0 && (
              <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
                <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resume.resume.languages?.map((lang, index) => (
                    <Badge
                      key={index}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {resume.experiences[0]?.company &&
              resume.experiences[0].startDate && (
                <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                    Experience
                  </h3>
                  <div className="space-y-6">
                    {resume.experiences.map((exp) => (
                      <div
                        key={exp._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
                      >
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 capitalize text-lg">
                            {exp.position}
                          </h4>
                          <p className="text-sm">{exp.company}</p>
                          <p className="text-gray-500 text-sm">
                            {formatDate(exp.startDate)} -{" "}
                            {formatDate(exp.endDate)}
                          </p>
                          {exp.jobDescription && (
                            <p className="text-gray-600 text-sm">
                              {exp.jobDescription}
                            </p>
                          )}
                        </div>
                        {exp.country && (
                          <p className="text-gray-600 text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {exp.city && `${exp.city}, `}
                              {exp.country}
                              {exp.zip && `, ${exp.zip}`}
                            </span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {resume.education[0]?.instituteName &&
              resume.education[0].startDate && (
                <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                    Education
                  </h3>
                  <div className="space-y-6">
                    {resume.education?.map((edu) => (
                      <div
                        key={edu._id}
                        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                      >
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 capitalize text-lg">
                            {edu.degree}
                            {edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}
                          </h4>
                          <p className="text-sm">{edu.instituteName}</p>
                          <p className="text-gray-500 text-sm">
                            {formatDate(edu.startDate)} -{" "}
                            {formatDate(edu.graduationDate)}
                          </p>
                        </div>

                        {edu.country && (
                          <p className="text-gray-600 text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {edu.city && `${edu.city}, `}
                              {edu.country}
                            </span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            {resume.awardsAndHonors?.length > 0 &&
              resume.awardsAndHonors[0].title && (
                <section className="py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                    Awards & Honours
                  </h3>
                  <div className="space-y-6">
                    {resume.awardsAndHonors?.map((award) => (
                      <div
                        key={award._id}
                        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                      >
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AwardIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-lg">
                            {award.title}
                          </h4>
                          <p className="text-gray-500 text-sm">
                            {formatDate(award.programeDate)}
                          </p>
                          {award.description && (
                            <p className="text-gray-600 text-sm">
                              {award.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
          </CardContent>
        </div>
      </div>
    </main>
  );
}
