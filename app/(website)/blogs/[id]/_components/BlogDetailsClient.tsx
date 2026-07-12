"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import PageHeaders from "../../../../../components/shared/PageHeaders";
import DOMPurify from "dompurify";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you're using shadcn/ui

interface BlogApiResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    slug?: string;
    title: string;
    description: string;
    image: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

const fetchBlog = async (identifier: string): Promise<BlogApiResponse> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/blogs/${identifier}`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch blog post");
  }
  return res.json();
};

export function BlogDetailsClient({ slugOrId }: { slugOrId: string }) {
  const { data, isLoading, isError, error } = useQuery<BlogApiResponse, Error>({
    queryKey: ["blog", slugOrId],
    queryFn: () => fetchBlog(slugOrId),
    enabled: Boolean(slugOrId),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12">
        <div className="pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Skeleton className="h-4 w-[100px]" />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Skeleton className="h-4 w-[60px]" />
                <BreadcrumbSeparator />
                <Skeleton className="h-4 w-[100px]" />
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        <div className="py-24 space-y-8">
          {/* Title Skeleton */}
          <Skeleton className="h-10 w-3/4 mx-auto" />
          
          {/* Image Skeleton */}
          <Skeleton className="w-full h-64 rounded-lg" />
          
          {/* Date Skeleton */}
          <Skeleton className="h-4 w-32" />
          
          {/* Content Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          <div className="space-y-4 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12 text-center text-red-500">
        <p>Error: {error?.message || "Failed to load blog post."}</p>
      </div>
    );
  }

  const blogPost = data?.data;

  if (!blogPost) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12 text-center">
        <p>Blog post not found.</p>
      </div>
    );
  }

  const formattedDate = new Date(blogPost.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="container mx-auto">
      <div className="pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="">
                Back to Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="" />
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="">
                Blogs
              </BreadcrumbLink>
              <BreadcrumbSeparator className="" />
              <BreadcrumbPage className="">Blog Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="py-6 md:py-24">
        <PageHeaders
          title={blogPost.title}
        />
        <article>
          {blogPost.image && (
            <div className="mb-8">
              <Image
                src={blogPost.image || "/assets/blog2.png"}
                alt={blogPost.title}
                width={1000}
                height={100}
                className="w-full h-[383px] object-cover rounded-[8px]"
                priority
                
              />
            </div>
          )}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-[24px] text-[#1B1B1B] font-semibold mb-6">
              {blogPost.title}
            </h1>
            <p className="text-sm text-gray-500 mb-4">{formattedDate}</p>
            <div
              className="list-item list-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(blogPost.description),
              }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}
