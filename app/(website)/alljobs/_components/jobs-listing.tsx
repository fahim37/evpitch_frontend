"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import JobCard from "@/components/shared/card/job-card";
import { Pagination } from "@/components/shared/pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface Job {
  _id: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  vacancy: number;
  experience: number;
  deadline: string;
  status: string;
  compensation: string;
  applicationRequirement: Array<{ requirement: string; _id: string }>;
  customQuestion: Array<{ question: string; _id: string }>;
  createdAt: string;
  applicantCount?: number;
  counter?: number;
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

interface RecommendedJobsResponse {
  success: boolean;
  message: string;
  data: {
    jobs?: Job[];
    exactMatches?: Job[];
    partialMatches?: Job[];
  };
}

const JobCardSkeleton = () => (
  <div className="border rounded-lg p-4">
    <Skeleton className="h-6 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

interface JobFitSummary {
  score: number;
  verdictCode: string;
  verdictMessage: string;
  aiSummary?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  jobSkills?: string[];
  profileSkills?: string[];
}

export default function JobsListing() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localSearchTerm, setLocalSearchTerm] = useState(searchParams.get("title") || "");

  const querySearchTerm = searchParams.get("title") || "";
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    setLocalSearchTerm(searchParams.get("title") || "");
  }, [searchParams]);

  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const role = (session?.user as any)?.role as string | undefined;
  const isCandidate = role === "candidate";

  // Fetch all jobs
  const {
    data: jobsData,
    isLoading: isJobsLoading,
  } = useQuery<JobsResponse, Error>({
    queryKey: ["jobs", currentPage, querySearchTerm],
    queryFn: async () => {
      const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/jobs`);
      url.searchParams.append("page", currentPage.toString());
      if (querySearchTerm) url.searchParams.append("title", querySearchTerm);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
  });

  // Fetch recommended jobs
  const { data: recommendedData, isLoading: isRecommendedLoading } = useQuery<
    RecommendedJobsResponse,
    Error
  >({
    queryKey: ["recommendedJobs", token],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/jobs/recommend`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch recommended jobs");
      return response.json();
    },
    enabled: !!token,
  });

  const jobs = jobsData?.data.jobs || [];
  const meta = jobsData?.data.meta || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  };
  const recommended =
    recommendedData?.data?.exactMatches && recommendedData.data.exactMatches.length > 0
      ? recommendedData.data.exactMatches
      : recommendedData?.data?.partialMatches || [];

  const recommendedJobs = useMemo(() => {
    if (!Array.isArray(recommended)) return [];
    return recommended
      .map((item: any) => (item?.job ? item.job : item))
      .filter((job: Job | undefined): job is Job => Boolean(job && job._id));
  }, [recommended]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading session...
      </div>
    );
  }

  // Handle filter click
  const handleFilter = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (localSearchTerm) {
      newParams.set("title", localSearchTerm);
    } else {
      newParams.delete("title");
    }
    newParams.set("page", "1");
    router.push(`?${newParams.toString()}`);
  };

  return (
    <div className="container mx-auto px-4">
      {/* Search Filter */}
      <div className="bg-[#E9ECFC] p-6 mb-12 w-full rounded-md">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Title, Skill, Category, Location, Location Type"
              className="pl-10 p-2 border rounded w-full"
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFilter();
                }
              }}
            />
          </div>
          <button
            onClick={handleFilter}
            className="bg-primary hover:bg-blue-700 text-white p-2 rounded w-full md:w-auto"
          >
            Search
          </button>
        </div>
      </div>

      {!querySearchTerm && recommendedJobs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Suggested jobs for you</h2>
          {isRecommendedLoading || !token ? (
            <div className="text-center text-gray-600">
              {!token ? (
                "Please log in to see suggested jobs."
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {Array(4)
                    .fill(0)
                    .map((_, index) => (
                      <JobCardSkeleton key={index} />
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendedJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  variant="list"
                  applicantCount={job.applicantCount ?? job.counter}
                />
              ))}
            </div>
          )}
        </div>
      )}


      {/* All Jobs */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          {querySearchTerm ? "Search results" : "Recent jobs"}
        </h2>

        {isJobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <JobCardSkeleton key={index} />
              ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-gray-600 py-10">
            {querySearchTerm
              ? "No results found. Try a different query."
              : "No jobs available at the moment."}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                variant="list"
                applicantCount={job.applicantCount ?? job.counter}
              />
            ))}
          </div>
        )}
        {meta.totalPages > 10 && (
          <div className="px-6 py-4">
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages}
              onPageChange={(page) => {
                const currentParams = new URLSearchParams(searchParams.toString());
                currentParams.set("page", page.toString());
                router.push(`?${currentParams.toString()}`);
              }}
              isLoading={isJobsLoading}
              totalItems={meta.totalItems}
              itemsPerPage={meta.itemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
