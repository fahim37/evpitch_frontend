"use client";

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
import { ChevronLeft, ChevronRight, Trash } from "lucide-react";
import Link from "next/link";

interface EmployeeData {
  _id: string;
  name: string;
  email: string;
  slug: string;
  role: string;
  photo?: { url: string };
  skills: string[];
}

interface RecruiterTableProps {
  recruiters: EmployeeData[];
  currentPage: number;
  totalPages: number;
  isFetching: boolean;
  handleDelete: (employeeId: string) => void;
  handlePreviousPage: (page?: number) => void;
  handleNextPage: () => void;
  isDeletePending: boolean;
}

export default function RecruiterTable({
  recruiters,
  currentPage,
  totalPages,
  isFetching,
  handleDelete,
  handlePreviousPage,
  handleNextPage,
  isDeletePending,
}: RecruiterTableProps) {
  return (
    <div className="">
      {recruiters.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-medium text-gray-700">
                Recruiter Name
              </TableHead>
              <TableHead className="font-medium text-gray-700">Role</TableHead>

              <TableHead className="font-medium text-gray-700">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recruiters.map((recruiter) => (
              <TableRow key={recruiter._id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={recruiter?.photo?.url}
                        alt={recruiter.name}
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                        {recruiter.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-blue-500">
                      <Link href={`/rp/${recruiter.slug}`}>
                        {recruiter.name}
                      </Link>
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-opacity-80"
                  >
                    {recruiter.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                    onClick={() => handleDelete(recruiter._id)}
                    disabled={isDeletePending}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {recruiters.length === 5 && (
        <div className="flex items-center justify-center gap-2 p-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 bg-transparent"
          onClick={() => handlePreviousPage()}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant="outline"
            size="sm"
            className={`h-8 w-8 p-0 ${
              currentPage === page
                ? "bg-primary text-white border-blue-600 hover:bg-blue-700"
                : "bg-transparent"
            }`}
            onClick={() => handlePreviousPage(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 bg-transparent"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      )}

      
      {isFetching && (
        <div className="text-center text-gray-500 pb-4">Updating list...</div>
      )}
    </div>
  );
}
