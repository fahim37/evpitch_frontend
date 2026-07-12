"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import JobCard from "@/components/shared/card/job-card"; // <-- import your JobCard component

interface Job {
  _id: string;
  title?: string;
  description?: string;
  salaryRange?: string;
  location?: string;
  deadline?: string;
  employement_Type?: string;
  // add other fields your JobCard expects
  [k: string]: any;
}

interface Bookmark {
  _id: string;
  userId: string;
  jobId: Job;
  bookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BookmarksResponse {
  success: boolean;
  message: string;
  data: {
    bookmarks: Bookmark[];
    meta: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<BookmarksResponse>({
    queryKey: ["bookmarks", userId],
    enabled: status === "authenticated" && !!userId,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/bookmarks/user/${userId}`
      );
      const json: BookmarksResponse = await res.json();
      if (!json.success) throw new Error(json.message);
      return json;
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (jobId: string) => {
      setSubmittingId(jobId);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, jobId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks", userId] });
      toast.success("Job bookmarked successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to bookmark job");
    },
    onSettled: () => setSubmittingId(null),
  });

  const handleToggleBookmark = (jobId: string) => {
    // if already bookmarked (exists in current list) - show a warning
    const alreadyBookmarked = data?.data.bookmarks.some(
      (b) => b.jobId._id === jobId
    );
    if (alreadyBookmarked) {
      toast.warning("Job already bookmarked by user");
      return;
    }
    bookmarkMutation.mutate(jobId);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 bg-gray-200 rounded flex-1"></div>
                  <div className="h-10 bg-gray-200 rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Please sign in to view your bookmarks
        </h1>
      </div>
    );
  }

  const bookmarks = data?.data.bookmarks ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      {isError || bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            No bookmarks yet
          </h2>
          <p className="text-gray-500">
            Start bookmarking jobs you're interested in!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookmarks.map((bookmark) => {
            // create a job object from bookmark.jobId and include bookmarked flag
            const job = {
              ...(bookmark.jobId || {}),
              bookmarked: !!bookmark.bookmarked,
            } as Job;

            // If you want the card to link to job details, keep Link here or let JobCard handle it.
            // I'm rendering JobCard directly and passing an optional onToggleBookmark handler.
            return (
              <div key={bookmark._id}>
                <JobCard
                  key={job._id}
                  job={job}
                  variant="list"
                  // optional: if your JobCard supports a bookmark toggle, pass it
                  onToggleBookmark={() => handleToggleBookmark(job._id)}
                  // optional: pass loading state for this job
                  bookmarkLoading={submittingId === job._id}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
