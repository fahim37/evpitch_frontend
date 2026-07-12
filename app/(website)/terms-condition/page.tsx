"use client";

import React from "react";
import PageHeaders from "@/components/shared/PageHeaders";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchTermsContent = async () => {
  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_BASE_URL}/content/terms`
  );
  return data;
};

const TermsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["content", "terms"],
    queryFn: fetchTermsContent,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeaders title={data?.title || "Terms & Conditions"} />

      {isLoading && (
        <p className="text-center text-gray-500 mt-8">Loading Terms...</p>
      )}
      {isError && (
        <p className="text-center text-red-600 mt-8">
          ❌ Failed to load Terms & Conditions
        </p>
      )}

      {data && (
        <div
          className="prose max-w-none mt-8 list-item list-none"
          dangerouslySetInnerHTML={{ __html: data?.data?.description || "" }}
        />
      )}
    </div>
  );
};

export default TermsPage;
