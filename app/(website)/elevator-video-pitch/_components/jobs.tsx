"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getRecruiterJobs, updateArchiveJob } from "@/lib/api-service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader } from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import DOMPurify from 'dompurify';

export default function CreatedJobs() {
  const queryClient = useQueryClient();

  const {
    data: recruitersJobs,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["archivedJobs"],
    queryFn: getRecruiterJobs,
    select: (data) => data?.data,
  });

  const archiveJobMutation = useMutation({
    mutationFn: ({ jobId, archive }: { jobId: string; archive: boolean }) =>
      updateArchiveJob(jobId, archive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archivedJobs"] });
      toast.success("Job archived successfully!");
    },
  });

  if (isPending) {
    return (
      <div className="flex justify-center items-center">
        <Loader className="animate-spin" />
      </div>
    );
  }


  if (!recruitersJobs?.length) {
    return (
      <div className="flex justify-center items-center text-gray-400">
        No archived jobs found
      </div>
    );
  }

  return (
    <div className="lg:space-y-10 space-y-5">
      <h2 className="text-[#4D4D4D] lg:text-3xl text-xl font-bold">
        Your Jobs
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recruitersJobs?.map((job: any) => (
          <div
            key={job._id}
            className="bg-[#F8F8F8] lg:p-7 p-3 lg:space-y-5 space-y-2 rounded-md"
          >
            <div className="flex justify-between items-center">
              <div className="">
                <h3 className="lg:text-lg text-base font-semibold capitalize">
                  {job.title}
                </h3>
              </div>
            </div>
            <div
              className="text-gray-600 text-sm line-clamp-2 prose prose-sm max-w-none text-start list-item list-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(job.description),
              }}
            />
            <div className="flex justify-between items-center gap-2">
              <Link
                href={`/alljobs/${job._id}`}
                className="hover:text-blue-600 hover:underline lg:text-lg text-sm font-medium"
              >
                View Job
              </Link>

              {/* Archive Switch */}
              <div className="flex items-center space-x-3    ">
                <Button
                  variant="outline"
                  className="bg-transparent text-black hover:bg-transparent text-sm lg:text-lg"
                  onClick={() => {
                    archiveJobMutation.mutate({
                      jobId: job._id,
                      archive: true,
                    });
                  }}
                  disabled={archiveJobMutation.isPending}
                >
                  {archiveJobMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader className="animate-spin" /> Archiving
                    </div>
                  ) : (
                    "Archive"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
