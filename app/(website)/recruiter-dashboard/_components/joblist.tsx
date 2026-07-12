"use client";

import { Button } from "@/components/ui/button";
import {
  deleteJob,
  getApplicationsByJobId,
  getRecruiterJobs,
} from "@/lib/api-service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface Job {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
  userId: string;
  companyId: string;
  description: string;
}

export default function JobList() {
  const [applicationCounts, setApplicationCounts] = useState<{
    [jobId: string]: number;
  }>({});
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const {
    data: jobs,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: getRecruiterJobs,
    select: (data) => data?.data, // Extract the `data` array from the response
  });

  useEffect(() => {
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) return;

    const fetchApplications = async () => {
      const results = await Promise.all(
        jobs.map(async (job: Job) => {
          const res = await getApplicationsByJobId(job._id);
          return { jobId: job._id, count: res?.data?.length ?? 0 };
        })
      );

      const counts: { [jobId: string]: number } = {};
      results.forEach(({ jobId, count }) => {
        counts[jobId] = count;
      });

      setApplicationCounts(counts);
    };

    fetchApplications();
  }, [jobs]);


  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onMutate: (id: string) => {
      setDeletingJobId(id);
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Job deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onSettled: () => {
      setDeletingJobId(null);
    },
  });

  if (isLoading) {
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

  if (!Array.isArray(jobs)) {
    console.error("Jobs is not an array:", jobs);
    return (
      <div className="flex justify-center items-center text-red-400">
        Error: Invalid job data
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {jobs.map((job: Job) => (
        <div
          key={job._id}
          className="bg-white p-6 rounded-lg shadow-[0px_0px_8px_0px_#00000029]"
        >
          <h3 className="text-lg lg:pb-4 pb-2">
            <span className="font-semibold">Job Title : </span> {job.title}
          </h3>
          <div className="flex justify-between items-center">
            <div>
              <h3>
                <span className="font-semibold">Status : </span> {job.status}
              </h3>
              <h3>
                <span className="font-semibold">Posted : </span>{" "}
                {formatDate(job.createdAt)}
              </h3>
            </div>
            <div className="rounded-md bg-[#E6F3FF] p-2 text-center">
              <p className="text-2xl font-medium">
                {applicationCounts[job._id] !== undefined ? (
                  `${applicationCounts[job._id]}`
                ) : (
                  <Loader className="animate-spin w-4 h-4 mx-auto" />
                )}
              </p>
              <p className="text-base">Applicants</p>
            </div>
          </div>
          <div className="flex justify-between items-center gap-3">
            <Button
              onClick={() => deleteJobMutation.mutate(job._id)}
              className="mt-4 w-full bg-red-500 hover:bg-red-600"
            >
              {deletingJobId === job._id ? "Deleting..." : "Delete Job"}
            </Button>
            <Link href={`/alljobs/${job._id}`}>
              <Button
                className="mt-4 w-full border-[#9EC7DC]"
                variant="outline"
              >
                View Details
              </Button>
            </Link>
            <Link href={`/applicants?jobId=${job._id}`}>
              <Button
                className="mt-4 w-full border-[#9EC7DC]"
                variant="outline"
              >
                View Applicants
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}