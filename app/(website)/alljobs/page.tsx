import React, { Suspense } from "react";
import { Metadata } from "next";
import JobsListing from "./_components/jobs-listing";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Jobs | Elevator Video Pitch©",
  description:
    "Browse curated job openings across industries and locations. Use smart filters to find roles that match your skills, experience, and career goals.",
};

function Page() {
  return (
    <div>
      <div
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.5)), url('/assets/alljobs.jpg')",
          backgroundPosition: "bottom center",
        }}
        className="bg-cover bg-center py-16"
      >
        <div className="container mx-auto px-4 text-white">
          <h1 className="text-4xl font-bold mb-4">Browse Jobs</h1>
          <p className="text-lg mb-6 max-w-2xl">
            Browse our curated job openings across industries and locations. Use
            smart filters to find roles that match your skills, experience, and
            career goals—your next opportunity starts here.
          </p>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-white">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">
                  Browse Jobs
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="container mx-auto py-8">
        <Suspense fallback={<div>Loading jobs...</div>}>
          <JobsListing />
        </Suspense>
      </div>
    </div>
  );
}

export default Page;
