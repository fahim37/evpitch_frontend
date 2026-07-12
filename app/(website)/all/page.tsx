"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

// Define base interfaces
interface Avatar {
  url?: string;
}
interface CompanyProfile {
  cname?: string;
  clogo?: string;
  country?: string;
  city?: string;
}
interface RecruiterAccount {
  bio?: string;
  photo?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  sureName?: string;
  country?: string;
  city?: string;
  zipCode?: string;
  emailAddress?: string;
  phoneNumber?: string;
  sLink?: { label: string }[];
}
interface User {
  _id: string;
  name?: string;
  email?: string;
  phoneNum?: string;
  role?: string;
  avatar?: Avatar;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  companyProfile?: CompanyProfile;
  recruiterAccount?: RecruiterAccount;
}
interface Meta {
  page: number;
  totalPages: number;
  totalItems: number;
}
interface ApiResponse {
  success: boolean;
  data: User[];
  meta: Meta;
}

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading resources...</p>
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
function PageContent() {
  const searchParams = useSearchParams();
  const resource = searchParams.get("resource");
  const title = searchParams.get("title");

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["resources", resource],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/${resource}?page=1&limit=15`
      );
      if (!response.ok) throw new Error("Failed to fetch data");
      return response.json();
    },
  });

  // Function to get display avatar
  const getAvatar = (user: User) =>
    user.avatar?.url ||
    user.companyProfile?.clogo ||
    user.recruiterAccount?.photo ||
    "";

  // Function to get subtitle (role or company name etc.)
  const getSubtitle = (user: User) => {
    if (user.role === "candidate") return "Candidate";
    if (user.role === "recruiter") return "Recruiter";
    if (user.companyProfile?.cname) return user.companyProfile.cname;
    return user.role || "";
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8 text-blue-600">
        {decodeURIComponent(title || "User List")}
      </h1>

      {isLoading && (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{(error as Error).message}</p>
        </div>
      )}

      {data && data.success && (
        <>
          <div className="space-y-4">
            {data.data.map((user) => (
              <motion.div
                key={user._id}
                whileHover={{ scale: 1.005 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Card className="flex items-center justify-between p-5 border rounded-2xl shadow hover:shadow-lg transition bg-white">
                  {/* Left: Avatar + Info */}
                  <div className="flex items-center space-x-5">
                    {getAvatar(user) ? (
                      <Image
                        src={getAvatar(user)}
                        alt={user.name || "User"}
                        width={64}
                        height={64}
                        className="rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xl">
                        {user.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {user.name || "Unknown User"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {getSubtitle(user)}
                      </p>
                      <p className="text-sm text-gray-600">📧 {user.email}</p>
                      <p className="text-sm text-gray-600">
                        📞 {user.phoneNum || "N/A"}
                      </p>
                      {user.address && (
                        <p className="text-sm text-gray-600">
                          📍 {user.address}
                        </p>
                      )}
                      {user.recruiterAccount?.country && (
                        <p className="text-sm text-gray-600">
                          🌍 {user.recruiterAccount.city},{" "}
                          {user.recruiterAccount.country}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Date + Actions */}
                  <div className="flex flex-col items-end space-y-2">
                    <p className="text-xs text-gray-400">
                      Joined{" "}
                      {new Date(user.createdAt || "").toLocaleDateString()}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Link href={`/${resource}-profile/${user._id}`}>
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {data.meta.totalItems > 10 && (
            <div className="mt-10 flex justify-center items-center space-x-6">
              <Button
                variant="outline"
                disabled={data.meta.page === 1}
                className="px-4 py-2"
              >
                ← Prev
              </Button>
              <span className="text-gray-600 font-medium">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={data.meta.page === data.meta.totalPages}
                className="px-4 py-2"
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Main page component with Suspense boundary
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PageContent />
    </Suspense>
  );
}