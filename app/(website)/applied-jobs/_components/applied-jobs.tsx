"use client";

import { getAppliedJobs } from "@/lib/api-service";
import { useQuery } from "@tanstack/react-query";
import { Heart, Loader } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import DOMPurify from "dompurify";

export default function AppliedJobs() {
  const { data: session } = useSession();

  const userId = session?.user?.id || "";

  const {
    data: appliedJobs,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["appliedJobs", userId],
    queryFn: () => getAppliedJobs(userId),
    enabled: !!userId,
  });



  if (isPending) {
    return (
      <div className="flex justify-center items-center">
        <Loader className="animate-spin" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex justify-center items-center text-red-400">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {appliedJobs?.data?.applications?.map((job: any) => (
        <div
          key={job._id}
          className="bg-[#F8F8F8] lg:p-7 p-3 lg:space-y-5 space-y-2 rounded-md"
        >
          <div className="flex justify-between items-center">
            <div className="">
              <h3 className="lg:text-lg text-base font-semibold">
                {job.jobId.title}
              </h3>
            </div>
            <div className="lg:w-8 w-5 lg:h-8 h-5 rounded-full flex justify-center items-center bg-[#2042E3]">
              <Heart
                className="lg:w-5 w-3 lg:h-5 h-3 stroke-none"
                fill="white"
              />
            </div>
          </div>
          <p
            className="lg:text-base text-sm list-item list-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(job.jobId.description),
            }}
          />
          <div className="flex justify-between items-center">
            <Link
              href={`/alljobs/${job.jobId._id}`}
              className="hover:text-blue-600 hover:underline lg:text-lg text-sm font-medium"
            >
              View Job
            </Link>
            <p className="font-medium text-sm lg:text-lg text-[#039B06]">
              Applied
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
