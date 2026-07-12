"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface User {
  _id: string;
  name: string;
  email: string;
  slug: string;
  avatar: { url: string };
}

interface resumeId {
  _id: string;
}

interface Answer {
  question: string;
  ans: string;
  _id: string;
}

interface Application {
  _id: string;
  jobId: string;
  resume?: {
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
    label: string;
    url: string;
    createdAt?: string;
    updatedAt?: string;
  };
  resumeId?: resumeId | string;
  userId: User;
  status:
    | "pending"
    | "shortlisted"
    | "rejected"
    | "interviewed"
    | "selected"
    | "application received"
    | "unsuccessful";
  createdAt: string;
  updatedAt: string;
  experience?: string;
  answer?: Answer[];
  hasValidVisa?: boolean | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Application[];
  meta?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const STATUS_OPTIONS = [
  {
    label: "Application Received",
    value: "pending" as const,
    color: "border-slate-600 text-slate-700 hover:bg-slate-50",
    active: "bg-slate-200 border-slate-700 text-slate-900 font-bold",
  },
  {
    label: "Shortlisted",
    value: "shortlisted" as const,
    color: "border-blue-600 text-blue-600 hover:bg-blue-50",
    active: "bg-blue-200 border-blue-700 text-blue-900 font-bold",
  },
  {
    label: "Unsuccessful",
    value: "rejected" as const,
    color: "border-red-600 text-red-600 hover:bg-red-50",
    active: "bg-red-200 border-red-700 text-red-900 font-bold",
  },
] as const;

const normalizeStatus = (
  status: Application["status"]
): "pending" | "shortlisted" | "rejected" | null => {
  if (!status) return null;
  const s = String(status).toLowerCase();
  if (s === "pending" || s === "application received") return "pending";
  if (s === "shortlisted") return "shortlisted";
  if (s === "rejected" || s === "unsuccessful") return "rejected";
  return null;
};

export default function JobApplicantsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = params.id as string;
  const currentPage = Number.parseInt(searchParams.get("page") || "1");

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [statusLoading, setStatusLoading] = useState<string[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Answer[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    applicationId?: string;
    newStatus?: "pending" | "shortlisted" | "rejected";
  }>({ open: false });

  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const hasVisaField = applications.some(
    (app) => typeof app.hasValidVisa === "boolean"
  );

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, currentPage]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/applied-jobs/job/${jobId}?page=${currentPage}`
      );

      if (!response.ok) throw new Error("Failed to fetch applications");

      const result: ApiResponse = await response.json();
      if (result.success) {
        setApplications(result.data);
        if (result.meta) setMeta(result.meta);
      } else {
        throw new Error(result.message || "Failed to fetch applications");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    applicationId: string,
    newStatus: "pending" | "shortlisted" | "rejected"
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/applied-jobs/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");

      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Could not update status. Please try again.");
    }
  };

  const confirmStatusChange = async () => {
    const { applicationId, newStatus } = confirmDialog;
    if (!applicationId || !newStatus) return;

    setStatusLoading((prev) => [...prev, applicationId]);

    await handleStatusUpdate(applicationId, newStatus);

    setStatusLoading((prev) => prev.filter((id) => id !== applicationId));

    setConfirmDialog({ open: false });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const handleOpenModal = (answers: Answer[] | undefined) => {
    setSelectedAnswers(answers || []);
    setIsModalOpen(true);
  };

  const renderVisaStatus = (status: boolean | null | undefined) => {
    if (typeof status !== "boolean") return "Not provided";
    return status ? "Yes" : "No";
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button onClick={fetchApplications}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log(applications);
  return (
    <div className="container mx-auto px-2 sm:px-4 py-8 w-full">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Applicant List
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Please update each applicant’s status at every stage of the
          recruitment process.
        </p>
      </div>

      <div className="rounded-lg overflow-x-auto">
        <Table className="min-w-full w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm sm:text-base text-[#2B7FD0] font-bold">
                Name
              </TableHead>
              <TableHead className="text-sm sm:text-base text-[#2B7FD0] font-bold">
                Applied
              </TableHead>
              <TableHead className="text-sm sm:text-base text-[#2B7FD0] font-bold">
                Details
              </TableHead>
              {hasVisaField && (
                <TableHead className="text-sm sm:text-base text-[#2B7FD0] font-bold">
                  Valid Visa
                </TableHead>
              )}
              {applications.length > 0 &&
                applications[0].answer &&
                applications[0].answer.length > 0 && (
                  <TableHead className="text-sm sm:text-base text-[#2B7FD0] font-bold">
                    Custom Question
                  </TableHead>
                )}
              <TableHead className="text-sm sm:text-base text-[#2B7FD0] font-bold">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={hasVisaField ? 6 : 5}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : applications.length > 0 ? (
              applications.map((application) => {
                const resumeId =
                  typeof application.resumeId === "string"
                    ? application.resumeId
                    : application.resumeId?._id || "";
                const normalized = normalizeStatus(application.status);
                const isUpdating = statusLoading.includes(application._id);

                return (
                  <TableRow
                    key={application._id}
                    className={`text-sm sm:text-base ${
                      application._id === selectedApplicationId
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                    onClick={() => setSelectedApplicationId(application._id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                          <AvatarImage src={application.userId.avatar.url} />
                          <AvatarFallback className="bg-gray-200 text-gray-700">
                            {getInitials(application.userId.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>{application.userId.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(application.createdAt)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/applicant-details/${
                          application.userId.slug
                        }?resumeId=${
                          resumeId
                        }&applicationId=${application._id}`}
                        className="text-xs sm:text-sm bg-[#2B7FD0] text-white py-2 px-3 rounded-lg font-medium"
                      >
                        Details
                      </Link>
                    </TableCell>
                    {hasVisaField && (
                      <TableCell>{renderVisaStatus(application.hasValidVisa)}</TableCell>
                    )}
                    {application.answer && application.answer.length > 0 && (
                      <TableCell>
                        <Dialog
                          open={isModalOpen}
                          onOpenChange={setIsModalOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleOpenModal(application.answer)
                              }
                            >
                              Answer
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] max-h-[600px] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Custom Question Answers</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              {selectedAnswers.length > 0 ? (
                                selectedAnswers.map((answer) => (
                                  <div
                                    key={answer._id}
                                    className="border-b pb-4"
                                  >
                                    <h3 className="font-semibold text-gray-800">
                                      {answer.question}
                                    </h3>
                                    <p className="text-gray-600 mt-1">
                                      {answer.ans}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500">
                                  No answers provided.
                                </p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((opt) => {
                          const active = normalized === opt.value;
                          const isDisabled = opt.value === "pending";
                          return (
                            <Button
                              key={opt.value}
                              variant={active ? "default" : "outline"}
                              className={`h-9 px-3 border rounded-lg ${
                                active ? opt.active : opt.color
                              } ${
                                isUpdating
                                  ? "opacity-60 cursor-not-allowed"
                                  : isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={isUpdating || isDisabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!active && !isDisabled) {
                                  setConfirmDialog({
                                    open: true,
                                    applicationId: application._id,
                                    newStatus: opt.value,
                                  });
                                }
                              }}
                            >
                              {opt.label}
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={hasVisaField ? 6 : 5} className="text-center py-8">
                  <p className="text-gray-500">No applications found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to change the applicant's status to{" "}
            <strong>{confirmDialog.newStatus}</strong>?
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button onClick={confirmStatusChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
          <div className="text-sm text-gray-500">
            Showing {(meta.currentPage - 1) * meta.itemsPerPage + 1} to{" "}
            {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)} of{" "}
            {meta.totalItems} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.currentPage - 1)}
              disabled={meta.currentPage <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === meta.currentPage ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.currentPage + 1)}
              disabled={meta.currentPage >= meta.totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
