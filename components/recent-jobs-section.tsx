"use client";

import { Button } from "@/components/ui/button";
import JobCard from "./shared/card/job-card";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Job {
  _id: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  vacancy: number;
  experience: number;
  compensation: string;
  createdAt: string;
}

interface JobsResponse {
  success: boolean;
  message: string;
  data: {
    meta: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    jobs: Job[];
  };
}

// Skeleton loader component for a single job card
const JobCardSkeleton = () => (
  <div className="p-6 bg-white rounded-lg shadow-md">
    <div className="skeleton skeleton-title mb-4"></div>
    <div className="skeleton skeleton-text mb-2"></div>
    <div className="skeleton skeleton-text mb-2"></div>
    <div className="skeleton skeleton-text mb-2"></div>
    <div className="skeleton skeleton-button mt-4"></div>
  </div>
);

export function RecentJobsSection() {
  // Fetch all jobs
  const {
    data: jobsData,
    isLoading: isJobsLoading,
    error: jobsError,
  } = useQuery<JobsResponse, Error>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/jobs`);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return response.json();
    },
  });

  if (isJobsLoading) {
    return (
      <section className="bg-gray-50">
        <div className="container auto text-center py-12 md:py-24 lg:px-4">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px]">
            Recent jobs
          </h2>
          <div className="w-[196px] h-[6px] bg-[#2B7FD0] rounded-[35px] mx-auto mt-4"></div>
          <div className="grid gap-6 lg:grid-cols-2 mt-12">
            {/* Render 8 skeleton cards to match the number of jobs displayed */}
            {Array.from({ length: 8 }).map((_, index) => (
              <JobCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (jobsError) {
    return (
      <div className="container px-4 md:px-6 text-center">
        Error: {jobsError.message}
      </div>
    );
  }

  const handleJobSelect = (jobId: string) => {
    // Handle job selection (e.g., navigate to job details)
    console.log("Selected job:", jobId);
  };

  return (
    <section className="bg-gray-50">
      <div className="container auto text-center py-12 md:py-24 lg:px-4">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px]">
          Recent jobs
        </h2>
        <div className="w-[196px] h-[6px] bg-[#2B7FD0] rounded-[35px] mx-auto mt-4"></div>
        <div className="grid gap-6 lg:grid-cols-2 mt-12">
          {jobsData?.data.jobs.slice(0, 8).map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onSelect={() => handleJobSelect(job._id)}
              variant="suggested" // or "list" depending on your design needs
            />
          ))}
        </div>
        <div className="flex items-center justify-center">
          <Link href="/alljobs">
            <Button className="mt-12 bg-[#2B7FD0] hover:bg-[#2B7FD0]/80 text-white px-8 py-3">
              View all
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}