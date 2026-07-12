"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PageHeaders from "@/components/shared/PageHeaders";

interface Blog {
  _id: string;
  slug?: string;
  title: string;
  description: string;
  image: string;
  userId: string;
  createdAt: string;
  authorName: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    blogs: Blog[];
  };
}

const fetchBlogs = async (): Promise<ApiResponse> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/blogs/get-all`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch blogs: ${response.statusText}`);
  }

  const json = await response.json();
  return json;
};

export default function BlogListingPage() {
  const { data, isLoading, isError, error } = useQuery<ApiResponse, Error>({
    queryKey: ["blogs"],
    queryFn: fetchBlogs,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card
              key={index}
              className="w-full max-w-sm rounded-lg shadow-md overflow-hidden"
            >
              <Skeleton className="w-full h-48 rounded-t-lg" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="p-4 pt-0">
                <Skeleton className="h-4 w-1/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 text-red-500">
        Error: {error?.message || "Failed to load blogs."}
      </div>
    );
  }

  // Check if data.data.blogs is an array
  if (!data?.data?.blogs || !Array.isArray(data.data.blogs)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeaders
          title="Blogs"
          description="Insights, ideas and updates on topics that matter most."
        />
        <div className="text-gray-500">
          No blogs available or invalid data received.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeaders
        title="Blogs"
        description="Insights, ideas and updates on topics that matter most."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.data.blogs.length === 0 ? (
          <div className="text-gray-500 col-span-full">
            No blogs found.
          </div>
        ) : (
          data.data.blogs.map((blog) => {
            const blogSlug = blog.slug || blog._id;
            const formattedDate = new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(new Date(blog.createdAt));

            return (
              <Link href={`/blogs/${blogSlug}`} key={blog._id}>
                <Card className="w-full shadow-none border-none overflow-hidden transition-all">
                  <div className="w-full h-[277px]">
                    <Image
                      src={blog.image}
                      alt={blog.title}
                      width={1000}
                      height={1000}
                      className="rounded-lg w-full h-full"
                    />
                  </div>
                  <CardContent className="py-4 !px-0 space-y-2">
                    <div className="text-xs text-[#595959] flex gap-[20px]">
                      {formattedDate}
                      <span className="text-black font-bold">{blog.authorName}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#272727]">
                      {blog.title}
                    </h3>
                    <div
                      className="text-gray-600 dark:text-gray-300 prose list-item list-none"
                      dangerouslySetInnerHTML={{
                        __html: blog.description
                          ? `${blog.description
                              .split(" ")
                              .slice(0, 10)
                              .join(" ")}${
                              blog.description.split(" ").length > 10
                                ? "..."
                                : ""
                            }`
                          : "No description available.",
                      }}
                    />
                  </CardContent>
                  <CardFooter className="py-4 pt-0 px-0">
                    <Link
                      href={`/blogs/${blogSlug}`}
                      className="inline-flex items-center text-sm font-medium text-[#9EC7DC]"
                    >
                      Read More
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardFooter>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
