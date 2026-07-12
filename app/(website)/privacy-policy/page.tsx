"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Suspense } from "react";
import PageHeaders from "@/components/shared/PageHeaders";

const fetchContent = async () => {
  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_BASE_URL}/content/privacy`
  );
  return data;
};

const PrivacyPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["content", "privacy"],
    queryFn: fetchContent,
  });

  if (isLoading) return <p className="text-center">Loading Privacy Policy...</p>;
  if (isError)
    return (
      <p className="text-center text-red-600">
        ❌ Failed to load Privacy Policy
      </p>
    );

  // The API returns { _id, type, title, description, ... }
  const content = data;

  return (
    <div className="w-full px-4 py-8 md:px-6 md:py-12 lg:py-16">
      <div className="container space-y-8">
        <Suspense fallback={null}>
          <PageHeaders title={content?.title || "Privacy Policy"}/>
        </Suspense>

        <div
          className="prose max-w-none list-item list-none"
          dangerouslySetInnerHTML={{ __html: content?.data?.description || "" }}
        />
      </div>
    </div>
  );
};

export default PrivacyPage;
