"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/pagination";

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    companyId: {
      cname: string;
    };
    recruiterId: {
      firstName: string;
      sureName: string;
    };
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  createdAt: string;
}

interface JobHistoryResponse {
  success: boolean;
  message: string;
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  data: {
    applications: Application[];
    createResume: any; // Not used in this component, but part of the API response
    education: any[];
    experience: any[];
    elevatorPitch: any;
    awardsAndHonor: any[];
  };
}

const fetchJobHistory = async (
  userId: string,
  page: number
): Promise<JobHistoryResponse> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/applied-jobs/user/${userId}?page=${page}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch job history");
  }
  return response.json();
};

export default function JobHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number.parseInt(searchParams.get("page") || "1");

  const userId = session?.user?.id;

  const { data, isLoading, isError } = useQuery<JobHistoryResponse, Error>({
    queryKey: ["jobHistory", userId, currentPage],
    queryFn: () => fetchJobHistory(userId as string, currentPage),
    enabled: !!userId, // Only fetch if userId is available
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Jobs History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="font-semibold text-gray-700">
                      Job Title
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Company Name
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Applied Date
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map(
                    (
                      _,
                      index // Show 5 skeleton rows
                    ) => (
                      <TableRow
                        key={index}
                        className={cn(index % 2 === 1 ? "bg-gray-50" : "")}
                      >
                        <TableCell className="font-medium">
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-28" />
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="px-6 py-4 flex justify-center">
              <Skeleton className="h-10 w-64" /> {/* Skeleton for pagination */}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error loading job history.
      </div>
    );
  }

  if (!session || !userId) {
    return (
      <div className="flex justify-center items-center h-screen">
        Please log in to view your job history.
      </div>
    );
  }

  const applications = data?.data?.applications || [];
  const meta = data?.meta || {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Jobs History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No job applications found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="font-semibold text-gray-700">
                      Job Title
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Company Name
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Applied Date
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application, index) => (
                    <TableRow
                      key={application._id}
                      className={cn(index % 2 === 1 ? "bg-gray-50" : "")}
                    >
                      <TableCell className="font-medium">
                        {application.jobId?.title}
                      </TableCell>
                      <TableCell>
                        {application.jobId?.recruiterId
                          ? `${
                              application.jobId.recruiterId.firstName ??
                              "Unknown"
                            } ${
                              application.jobId.recruiterId.sureName ?? ""
                            }`.trim()
                          : application.jobId?.companyId?.cname ??
                            "Unknown Company"}
                      </TableCell>
                      {/* Hardcoded as per image, no company name in API */}
                      <TableCell>
                        {new Date(application.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "long", day: "numeric" }
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium",
                          application.status === "pending" && "text-blue-600", // Assuming "pending" maps to "Reviewing"
                          application.status === "rejected" && "text-red-600" // Assuming "rejected" maps to "Not Shortlisted"
                          // Add more status mappings if needed
                        )}
                      >
                        {{
                          pending: "Reviewing",
                          rejected: "Not Shortlisted",
                          shortlisted: "Shortlisted",
                        }[application.status] || application.status}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {meta.totalPages > 10 && (
            <div className="px-6 py-4 flex justify-center">
              <Pagination
                currentPage={meta.currentPage}
                totalPages={meta.totalPages}
                onPageChange={(page) => {
                  const currentParams = new URLSearchParams(
                    searchParams.toString()
                  );
                  currentParams.set("page", page.toString());
                  router.push(`?${currentParams.toString()}`);
                }}
                isLoading={isLoading}
                totalItems={meta.totalItems}
                itemsPerPage={meta.itemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
