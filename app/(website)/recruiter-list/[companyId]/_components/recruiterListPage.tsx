"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import RecruiterTable from "./RecruiterTable";
import PendingEmployeeRequest from "./PendingEmployeeRequest";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmployeeSelector } from "@/components/company/employee-selector";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EmployeeData {
  _id: string;
  name: string;
  email: string;
  slug: string;
  phoneNum: string;
  role: string;
  skills: string[];
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phoneNum: string;
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

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    company: {
      _id: string;
      cname: string;
      industry: string;
      aboutUs: string;
      country: string;
      city: string;
    };
    employees: EmployeeData[];
    request: RequestData[];
    meta: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

interface RecruiterListPageProps {
  companyId: string;
}

export default function RecruiterListPage({
  companyId,
}: RecruiterListPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showRequests, setShowRequests] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeeToDelete, setEmployeeToDelete] = useState<string>(""); // Single ID as string
  const queryClient = useQueryClient();

  const session = useSession();
  const userId = session.data?.user?.id;
  const token = session.data?.accessToken;

  const { data, isLoading, isError, error, isFetching } = useQuery<
    ApiResponse,
    Error
  >({
    queryKey: ["employees", companyId, currentPage],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/company-employess/skills/${companyId}?page=${currentPage}`
      );
      if (!res.ok) {
        throw new Error(
          res.status === 404 ? "Company not found" : "Failed to fetch employees"
        );
      }
      const response = (await res.json()) as ApiResponse;
      if (!response.success) {
        throw new Error(
          response.message || "API returned an unsuccessful response"
        );
      }
      return response;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  

  const handleInvalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["employees", companyId, currentPage],
    });
  };

  // Add Employees Mutation (kept as array for multiple adds; adjust if needed)
  const addEmployeesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/add-employee-to-company`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ companyId, employeeIds: selectedEmployees }),
        }
      );
      const response = await res.json();
      if (!res.ok || !response.success)
        throw new Error(response.message || "Failed to add employees");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees", companyId, currentPage],
      });
      setShowAddModal(false);
      setSelectedEmployees([]);
    },
    onError: (err: any) =>
      console.error("Error adding employees:", err.message),
  });

  // Delete Employee Mutation (single ID as string)
  const deleteMutation = useMutation<DeleteResponse, Error, string>({
    mutationFn: async (employeeId: string) => {
      if (!employeeId) {
        throw new Error("No employee selected for deletion");
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/remove-employee-to-company`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ companyId, employeeId: employeeId }), // Send as string
        }
      );
      const response = await res.json();
      if (!res.ok || !response.success) {
        throw new Error(response.message || "Failed to remove employee");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees", companyId, currentPage],
      });
      setShowDeleteModal(false);
      setEmployeeToDelete("");
    },
    onError: (err: any) => {
      console.error("Error removing employee:", err.message);
    },
  });

  // Handle delete initiation
  const handleDelete = (employeeId: string) => {
    if (employeeId) {
      setEmployeeToDelete(employeeId); // Single ID as string
      setShowDeleteModal(true);
    }
  };

  // Confirm delete action
  const confirmDelete = () => {
    if (employeeToDelete) {
      deleteMutation.mutate(employeeToDelete);
    }
  };

  // Pagination
  const handlePreviousPage = (page?: number) => {
    if (page) setCurrentPage(page);
    else if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < (data?.data?.meta?.totalPages || 1))
      setCurrentPage(currentPage + 1);
  };

  const recruiters: EmployeeData[] = data?.data?.employees || [];
  const requests: RequestData[] = data?.data?.request || [];
  const totalPages = data?.data?.meta?.totalPages || 1;

  if (isLoading && !data)
    return <div className="p-6 container mx-auto">Loading...</div>;
  if (isError)
    return <div className="p-6 container mx-auto">Error: {error.message}</div>;

  return (
    <div className="p-6 container mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 border-b mb-6">
        <Link href="/elevator-video-pitch">
          <Button variant="ghost" size="icon" className="text-gray-500">
            <ArrowLeft className="h-6 w-6 text-gray-500" />
            Back
          </Button>
        </Link>
        {recruiters.length > 0 && (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold mb-6 md:mb-0 ">
              Internal recruiter List
            </h1>
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={() => setShowAddModal(true)}>
            Add Internal recruiter
          </Button>
        </div>
      </div>

      {/* Recruiters Table */}
      <RecruiterTable
        recruiters={recruiters}
        currentPage={currentPage}
        totalPages={totalPages}
        isFetching={isFetching}
        handleDelete={handleDelete}
        handlePreviousPage={handlePreviousPage}
        handleNextPage={handleNextPage}
        isDeletePending={deleteMutation.isPending}
      />

      {/* Requests Section */}
      <PendingEmployeeRequest
        companyId={companyId}
        requests={requests}
        setShowRequests={setShowRequests}
        handleInvalidate={handleInvalidate}
      />

      {/* Add Recruiter Modal */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Recruiters</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <EmployeeSelector
                selectedEmployees={selectedEmployees}
                onEmployeesChange={setSelectedEmployees}
              />
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => addEmployeesMutation.mutate()}
                disabled={
                  selectedEmployees.length === 0 ||
                  addEmployeesMutation.isPending
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this recruiter? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setEmployeeToDelete("");
                }}
              >
                No
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending || !employeeToDelete}
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
