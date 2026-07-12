"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

const fetchFaqs = async (): Promise<FaqItem[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/faqs`, {
    // avoid caching if needed:
    // cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch FAQs");
  const json = await res.json();
  return json.data as FaqItem[];
};

function FaqSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="container py-8 lg:py-12 space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg overflow-hidden shadow-[0px_11.22px_33.67px_0px_#0000000D] bg-[#F3F6FF] px-6 py-4 space-y-3"
        >
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function FaqSection() {
  const {
    data: faqs,
    isLoading,
    isError,
    error,
  } = useQuery<FaqItem[]>({
    queryKey: ["faqs"],
    queryFn: fetchFaqs,
  });

  if (isLoading) return <FaqSkeletonList />;

  if (isError)
    return (
      <div className="container py-10 text-center text-red-600">
        Error loading FAQs: {(error as Error).message}
      </div>
    );

  if (!faqs || faqs.length === 0)
    return (
      <div className="container py-10 text-center text-gray-500">
        No FAQs available.
      </div>
    );

  const sorted = [...faqs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="container py-8 lg:py-12">
      <Accordion type="single" collapsible className="w-full space-y-2">
        {sorted.map((item) => (
          <AccordionItem
            key={item._id}
            value={item._id}
            className="border-b-0 rounded-lg overflow-hidden shadow-[0px_11.22px_33.67px_0px_#0000000D] bg-[#F3F6FF]"
          >
            <AccordionTrigger className="px-6 py-4 text-left text-xl text-[#131313] font-semibold transition-colors duration-200">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-[18px] text-[#606267] leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
