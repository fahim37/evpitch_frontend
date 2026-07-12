"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { toast } from "sonner"; // Import toast
import Link from "next/link";

interface UserData {
  _id: string;
  name: string;
  email: string;
  phoneNum: string;
  slug: string;
  role: string;
  avatar?: { url: string };
}

interface RequestData {
  _id: string;
  userId: UserData;
  company: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface UpdateStatusResponse {
  success: boolean;
  message: string;
  data: RequestData;
}

interface PendingEmployeeRequestProps {
  companyId: string;
  requests: RequestData[];
  setShowRequests: (value: boolean) => void;
  handleInvalidate: () => void;
}

export default function PendingEmployeeRequest({
  handleInvalidate,
  requests,
  setShowRequests,
}: PendingEmployeeRequestProps) {
  const [showRequests, setLocalShowRequests] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const companyId = requests[0]?.company;

  // Mutation to update request status
  const updateStatusMutation = useMutation<
    UpdateStatusResponse,
    Error,
    { requestId: string; status: string; userId: string }
  >({
    mutationFn: async ({ requestId, status, userId }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/update-company-employee/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, companyId, userId }),
        }
      );

      if (!res.ok) throw new Error("Failed to update request status");

      const response = (await res.json()) as UpdateStatusResponse;
      if (!response.success) {
        throw new Error(response.message || "Failed to update request status");
      }
      return response;
    },
    onSuccess: (data) => {
      if (handleInvalidate) handleInvalidate();

      // OR directly invalidate the query here
      // queryClient.invalidateQueries(["employees", data.data.companyId]);
      toast.success(`Request ${data.data.status.toLowerCase()} successfully!`, {
        duration: 3000,
      }); // Show success toast
    },
    onError: (error) => {
      console.error("Error updating status:", error.message);
      toast.error(`Error: ${error.message}`, { duration: 4000 }); // Show error toast
    },
  });

  // Updated handleStatusUpdate to accept userId
  const handleStatusUpdate = (
    requestId: string,
    userId: string,
    newStatus: string
  ) => {
    updateStatusMutation.mutate({ requestId, status: newStatus, userId });
  };

  const handleToggleRequests = () => {
    setLocalShowRequests(!showRequests);
    setShowRequests(!showRequests);
  };

  return (
    <div>
      <div className="mt-6">
        {requests.length > 0 && (
          <div>
            <h2 className="text-2xl text-center font-semibold mb-4 p-4">
              Recruiter Requests
            </h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium text-gray-700">
                    User
                  </TableHead>
                  <TableHead className="font-medium text-gray-700">
                    Status
                  </TableHead>
                  <TableHead className="font-medium text-gray-700">
                    Created At
                  </TableHead>
                  <TableHead className="font-medium text-gray-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-gray-500"
                    >
                      No requests available.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={req.userId?.avatar?.url || "/placeholder.svg"}
                              alt={req.userId?.name}
                            />
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                              {req.userId?.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">
                            <Link
                              href={`/rp/${req.userId?.slug}`}
                            >
                              {req.userId?.name}
                            </Link>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`
                          ${
                            req.status.toLowerCase() === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : ""
                          }
                          ${
                            req.status.toLowerCase() === "approved"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                          ${
                            req.status.toLowerCase() === "rejected"
                              ? "bg-red-100 text-red-800"
                              : ""
                          }
                        `}
                        >
                          {req.status.charAt(0).toUpperCase() +
                            req.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {req.status.toLowerCase() === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                                onClick={() =>
                                  handleStatusUpdate(
                                    req._id,
                                    req.userId._id,
                                    "accepted"
                                  )
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                                onClick={() =>
                                  handleStatusUpdate(
                                    req._id,
                                    req.userId._id,
                                    "rejected"
                                  )
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
