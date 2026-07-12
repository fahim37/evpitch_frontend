"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Types based on your API response
interface Company {
  _id: string;
  userId: string;
  clogo: string;
  banner: string;
  aboutUs: string;
  cname: string;
  country: string;
  city: string;
  zipcode: string;
  cemail: string;
  sLink: Array<{
    label: string;
    url: string;
    _id: string;
  }>;
  industry: string;
  service: string[];
  employeesId: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApplicationRequirement {
  requirement: string;
  status: string;
  _id: string;
}

interface CustomQuestion {
  question: string;
  _id: string;
}

interface Job {
  _id: string;
  userId: string;
  companyId: Company;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  vacancy: number;
  applicantCount: number;
  experience: string;
  derivedStatus: string;
  deadline: string;
  status: string;
  jobCategoryId: string;
  name: string;
  role: string;
  compensation: string;
  arcrivedJob: boolean;
  applicationRequirement: ApplicationRequirement[];
  customQuestion: CustomQuestion[];
  jobApprove: string;
  adminApprove: boolean;
  publishDate: string;
  employement_Type: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Job[];
}

type PostingUsage = {
  usage?: {
    monthlyLimit?: number;
    monthlyUsed?: number;
    monthlyRemaining?: number;
    annualLimit?: number;
    annualUsed?: number;
    annualRemaining?: number;
  };
  plan?: {
    title?: string;
    valid?: string;
  };
};

interface ManagePageProps {
  userId: string;
}

// Fetch function
const fetchJobs = async (userId: string): Promise<Job[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/all-jobs-for-company/company/${userId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }

  const data: ApiResponse = await response.json();
  return data.data;
};

const fetchPostingUsage = async (token?: string): Promise<PostingUsage | null> => {
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/posting/usage`,
    {
      headers,
    }
  );
  if (!response.ok) return null;
  const json = await response.json();
  return json?.data ?? null;
};

// Skeleton loader component
const JobTableSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-32" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function ManagePage({ userId }: ManagePageProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

 const { data: session, status } = useSession();
const token = session?.accessToken as string | undefined;

const { data: postingUsage } = useQuery({
  queryKey: ["postingUsage", token],
  queryFn: () => fetchPostingUsage(token),
  enabled: status === "authenticated" && !!token,
});


  // Track which job we're confirming for
  const [confirmJobId, setConfirmJobId] = React.useState<string | null>(null);

  const {
    data: jobs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["jobs", userId],
    queryFn: () => fetchJobs(userId),
    enabled: !!userId, // Only run query if userId exists
  });

  const toggleArchive = async (jobId: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${jobId}/archive`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to update archive status");
    }

    const data = await res.json();
    return data; // assume response includes updated job with arcrivedJob field
  };

  const { mutate: handleArchive, isPending: isArchiving } = useMutation({
    mutationFn: toggleArchive,
    onSuccess: (data) => {
      if (data?.arcrivedJob === true) {
        toast.success("Job archived successfully!");
      } else if (data?.arcrivedJob === false) {
        toast.success("Job unarchived successfully!");
      }
      setConfirmJobId(null);
      queryClient.invalidateQueries({ queryKey: ["jobs", userId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
      setConfirmJobId(null);
    },
  });

  // Pagination calculations
  const totalPages = Math.ceil(jobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = jobs.slice(startIndex, startIndex + itemsPerPage);
  const monthlyLimit = postingUsage?.usage?.monthlyLimit;
  const monthlyUsed = postingUsage?.usage?.monthlyUsed ?? jobs.length;
  const monthlyRemaining = postingUsage?.usage?.monthlyRemaining;
  const annualLimit = postingUsage?.usage?.annualLimit;
  const annualUsed = postingUsage?.usage?.annualUsed ?? jobs.length;
  const annualRemaining = postingUsage?.usage?.annualRemaining;
  const planLabel = postingUsage?.plan?.title || postingUsage?.plan?.valid;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading jobs: {(error as Error).message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper: request archive with confirmation if needed
  const requestArchive = (job: Job) => {
    if (job.applicantCount > 0 && !job.arcrivedJob) {
      // Show modal only when archiving (not unarchiving) and there are applicants
      setConfirmJobId(job._id);
      return;
    }
    handleArchive(job._id);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Jobs</h1>
        <p className="text-muted-foreground">
          View and manage all your job postings
        </p>
      </div>

      {postingUsage && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{planLabel || "Current plan"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Posted (month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {monthlyUsed} / {monthlyLimit ?? "auto"}
              </p>
              <p className="text-xs text-muted-foreground">
                Remaining: {monthlyRemaining ?? "auto"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Posted (year)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {annualUsed} / {annualLimit ?? "auto"}
              </p>
              <p className="text-xs text-muted-foreground">
                Remaining: {annualRemaining ?? "auto"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{jobs.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <JobTableSkeleton />
      ) : (
        <div>
          <div className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applicants list</TableHead>
                    <TableHead>Vacancy</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedJobs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No job postings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedJobs.map((job) => (
                      <TableRow key={job._id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.name}</TableCell>
                        <TableCell>{job.location}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {job.experience}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(job.deadline)}</TableCell>
                        <TableCell>{job.derivedStatus}</TableCell>
                        <TableCell>
                          <Link
                            href={`/candidate-list/${job._id}`}
                            className="text-blue-600 hover:underline"
                          >
                            View {" "}
                            <span className="text-gray-500">({job.applicantCount})</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{job.vacancy}</Badge>
                        </TableCell>
                        <TableCell className="flex items-center justify-center gap-2">
                          <Badge variant="secondary">
                            <Link
                              href={`/single-job/${job._id}`}
                              className="text-blue-600 hover:underline"
                            >
                              Job details
                            </Link>
                          </Badge>
                          <Button
                            onClick={() => requestArchive(job)}
                            className={`px-3 rounded ${
                              job.arcrivedJob
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-green-100 text-green-600 hover:bg-green-200"
                            } ${isArchiving ? "opacity-50 pointer-events-none" : ""}`}
                            disabled={isArchiving}
                          >
                            {isArchiving
                              ? "Processing..."
                              : job.arcrivedJob
                              ? "Unarchive"
                              : "Archive"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, jobs.length)} of {jobs.length} entries
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((prev) => Math.max(prev - 1, 1));
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(pageNum);
                            }}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      <AlertDialog open={!!confirmJobId} onOpenChange={(open) => !open && setConfirmJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Before you archive this job</AlertDialogTitle>
            <AlertDialogDescription>
              Kindly remember to update each applicant on the final status of their application,
              using our intuitive one-click feedback tool in your job applicants panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving} onClick={() => setConfirmJobId(null)}>No</AlertDialogCancel>
            <AlertDialogAction
              disabled={isArchiving}
              onClick={() => confirmJobId && handleArchive(confirmJobId)}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ManagePage;
