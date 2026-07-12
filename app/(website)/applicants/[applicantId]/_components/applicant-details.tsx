"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getResumeByUserId, getResumeDownloadUrl } from "@/lib/api-service";
import { useQuery } from "@tanstack/react-query";
import {
  AwardIcon,
  Briefcase,
  Download,
  GraduationCap,
  Loader,
  MapPin,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export default function ApplicantDetails({
  applicantId,
}: {
  applicantId: string;
}) {
  const {
    data: applicantResume,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["resume"],
    queryFn: () => getResumeByUserId(applicantId),
    select: (data) => data?.data,
  });

  const session = useSession();
  const router = useRouter();
  const [isLoadingRoomCreation, setIsLoadingRoomCreation] = useState(false);
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      year: "numeric",
      month: "long",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <Loader className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center text-red-400 py-20">
        Error: {error.message}
      </div>
    );
  }


  const applicationDate = applicantResume?.applications?.find(
    (application: any) => application?.userId?._id === applicantId
  ).createdAt;

  const latestApplication = applicantResume?.applications?.reduce(
    (latest: any, current: any) => {
      if (!latest) return current;
      if (!current?.createdAt) return latest;
      if (!latest?.createdAt) return current;
      return new Date(current.createdAt) > new Date(latest.createdAt)
        ? current
        : latest;
    },
    null
  );

  const resumeId =
    latestApplication?.resumeId?._id ?? latestApplication?.resumeId;


  const handleCreateChatRoom = async () => {
    setIsLoadingRoomCreation(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/message-room/create-message-room`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: applicantId,
            recruiterId: session?.data?.user?.id,
          }),
        }
      );
      const resJson = await res.json();

      if (resJson.success) {
        router.push(`/messages`);
      } else {
        toast.error(resJson.message);
        if (resJson.message === "Message room already exists") {
          router.push(`/messages`);
        }
      }
    } catch (error) {
      toast.error("Failed to create chat room");
    } finally {
      setIsLoadingRoomCreation(false);
    }
  };

  const handleResumeDownload = async () => {
    if (!resumeId) {
      toast.error("Resume not available");
      return;
    }

    setIsDownloadingResume(true);
    try {
      const res = await getResumeDownloadUrl(resumeId);
      const downloadUrl = res?.data?.url;
      const filename = res?.data?.filename || "resume.pdf";

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

  return (
    <div className="lg:px-7 space-y-8 lg:space-y-20">
      <div className="text-center">
        <h2 className="text-xl lg:text-4xl font-bold">Applicant Details</h2>
      </div>
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-0">
        <div className="lg:-mt-5">
          <Avatar className="h-[200px] w-[200px] mx-auto lg:mx-0">
            <AvatarImage
              src={applicantResume?.createResume?.photo}
              alt={applicantResume?.createResume?.firstName}
            />
            <AvatarFallback className="text-4xl font-semibold bg-gray-200">
              {applicantResume?.createResume?.firstName[0]}
              {applicantResume?.createResume?.lastName[0]}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col md:flex-row justify-between flex-1 gap-5 lg:gap-0">
          <div className="lg:space-y-8 space-y-4 lg:pl-20">
            <p className="text-lg">
              <span className="font-semibold">Full Name:</span>{" "}
              {applicantResume?.createResume?.firstName}{" "}
              {applicantResume?.createResume?.lastName}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Current Role:</span>{" "}
              {applicantResume?.experience?.[0]?.jobTitle}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Application Date:</span>{" "}
              {formatDate(applicationDate)}
            </p>
          </div>
          <div className="space-y-4 lg:space-y-8">
            <p className="text-lg">
              <span className="font-semibold">Location:</span>{" "}
              {applicantResume?.createResume?.city} -{" "}
              {applicantResume?.createResume?.zipCode},{" "}
              {applicantResume?.createResume?.country}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Years of Experience:</span> Demo -
              2 Years
            </p>
            <p className="text-lg">
              <span className="font-semibold">Email:</span>{" "}
              {applicantResume?.createResume?.email}
            </p>
            
            <Button
              onClick={handleResumeDownload}
              disabled={isDownloadingResume || !resumeId}
              className="bg-[#2B7FD0]/90 hover:bg-[#2B7FD0] h-8 sm:h-[35px] text-sm sm:text-base px-3 sm:px-4 rounded-[8px]"
            >
              {isDownloadingResume ? "Downloading..." : "Resume"}
              <Download className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Experience Section */}
      <section className="">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 lg:mb-8">
          Experience
        </h3>
        <div className="space-y-6">
          {applicantResume?.experience.map(
            (exp: {
              _id: string;
              jobTitle: string;
              employer: string;
              city: string;
              country: string;
              startDate: string;
              endDate: string;
              jobDescription: string;
            }) => (
              <div
                key={exp._id}
                className="flex flex-col sm:flex-row items-start sm:items-center lg:gap-16 gap-4 justify-between lg:justify-start"
              >
                <div className="flex gap-5 items-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="">
                    <h4 className="font-semibold text-[#595959] text-lg capitalize">
                      {exp.jobTitle || "Job Title"}
                    </h4>
                    <h3 className="text-gray-600 text-sm">{exp.employer}</h3>
                    <p className="text-gray-600 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {`${exp.city || "City"}, `} {exp.country}
                      </span>
                    </p>
                    <p className="text-gray-500 text-sm">
                      {formatDate(exp.endDate)} - {formatDate(exp.startDate)}
                    </p>
                  </div>
                </div>
                <div className="">
                  <p>{exp?.jobDescription}</p>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* Education Section */}
      <section className="">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 lg:mb-8">
          Education
        </h3>
        <div className="space-y-6">
          {applicantResume?.education.map(
            (edu: {
              _id: string;
              degree: string;
              fieldOfStudy: string;
              instituteName: string;
              city: string;
              state: string;
              graduationDate: string;
            }) => (
              <div
                key={edu._id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 capitalize text-lg">
                    {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                  </h4>
                  <p className="text-sm">{formatDate(edu.graduationDate)}</p>
                  <p className="text-sm">{edu.instituteName}</p>
                </div>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {edu.city && `${edu.city}, `} {edu.state}
                  </span>
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Skills Section */}
      <section className="">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 lg:mb-8">
          Skills
        </h3>
        <div className="flex flex-wrap gap-2">
          {applicantResume?.createResume?.skills.map(
            (skill: string, index: number) => (
              <Badge
                key={index}
                className="text-white px-3 py-2 text-sm bg-[#2B7FD0] rounded-sm"
              >
                {skill}
              </Badge>
            )
          )}
        </div>
      </section>

      {/* Awards & Honours Section */}
      <section className="">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 lg:mb-8">
          Awards & Honours
        </h3>
        <div className="space-y-6">
          {applicantResume?.awardsAndHonor?.map(
            (award: {
              _id: string;
              title: string;
              createdAt: string;
              description: string;
            }) => (
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
                    {formatDate(award.createdAt)}
                  </p>
                  {award.description && (
                    <p className="text-gray-600 text-sm">{award.description}</p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* Action button */}
      <section>
        <div className="flex justify-center gap-2">
          <Button
            onClick={handleCreateChatRoom}
            className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white"
          >
            {isLoadingRoomCreation ? (
              <Loader className="animate-spin" />
            ) : (
              "Message"
            )}
          </Button>
          <Button className="bg-[#038C05] hover:bg-[#038C05]/90 text-white">
            Reviewing
          </Button>
          <Button className="bg-[#ED1C24] hover:bg-[#ED1C24]/90 text-white">
            Not Shortlisted
          </Button>
        </div>
      </section>
    </div>
  );
}
