"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

// Define the type for a single job category
interface JobCategory {
  _id: string;
  name: string;
  categoryIcon: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Function to fetch job categories from the API
const fetchJobCategories = async (): Promise<JobCategory[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/category/job-category`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch job categories");
  }
  const data = await response.json();
  return data.data; // Return the array of job categories
};

export function SectorSection() {
  // Use TanStack Query to fetch data
  const {
    data: sectors,
    isLoading,
    error,
  } = useQuery<JobCategory[], Error>({
    queryKey: ["jobCategories"], // Unique key for the query
    queryFn: fetchJobCategories, // Function to fetch data
  });

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Sector
        </h2>
        <div className="w-[196px] h-[6px] bg-[#2B7FD0] rounded-[35px] mx-auto mt-4"></div>

        {/* Loading State */}
        {isLoading && <p>Loading job categories...</p>}

        {/* Error State */}
        {error && <p>Error: {error.message}</p>}

        {/* Data Rendering */}
        {sectors && (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-12">
            {sectors.map((sector) => (
              <Link href={`/alljobs/${sector._id}`} key={sector._id}>
                <Card
                  className="flex flex-col items-center p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="mb-2 bg-[#E9ECFC] w-[64px] h-[64px]">
                    <Image
                      src={sector.categoryIcon} // Use categoryIcon from API
                      alt={sector.name}
                      width={100}
                      height={100}
                      className="h-[24px] w-[24px]"
                    />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <CardTitle className="text-[16px] font-normal">
                      {sector.name}
                    </CardTitle>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
