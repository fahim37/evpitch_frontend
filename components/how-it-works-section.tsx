"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

/* ---------------------- API FETCHERS ---------------------- */
const fetchContent = async (type: string) => {
  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_BASE_URL}/content/${type}`
  );
  return data;
};



export function HowItWorksSection() {
  const candidateQuery = useQuery({
    queryKey: ["content", "candidate"],
    queryFn: () => fetchContent("candidate"),
  });

  const recruiterQuery = useQuery({
    queryKey: ["content", "recruiter"],
    queryFn: () => fetchContent("recruiter"),
  });

  const companyQuery = useQuery({
    queryKey: ["content", "company"],
    queryFn: () => fetchContent("company"),
  });

  const isLoading =
    candidateQuery.isLoading ||
    recruiterQuery.isLoading ||
    companyQuery.isLoading;

  const isError =
    candidateQuery.isError ||
    recruiterQuery.isError ||
    companyQuery.isError;


  if (isLoading) {
    return (
      <section className="w-full py-10 md:py-16 bg-gray-50">
        <div className="container text-center px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px] text-[#000000]">
            How It Works
          </h2>
          <div className="w-[180px] md:w-[240px] h-[4px] bg-primary rounded-[35px] mt-4"></div>
          <p className="mt-10 text-gray-500">Loading content...</p>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="w-full py-10 md:py-16 bg-gray-50">
        <div className="container text-center px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px] text-[#000000]">
            How It Works
          </h2>
          <div className="w-[180px] md:w-[240px] h-[4px] bg-primary rounded-[35px] mt-4"></div>
          <p className="mt-10 text-red-500">
            ❌ Failed to load content. Please try again later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-10 md:py-16 bg-gray-50">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px] text-[#000000]">
          How It Works
        </h2>
        <div className="w-[180px] md:w-[240px] h-[4px] bg-primary rounded-[35px] mt-4"></div>

        {/* Cards grid */}
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3 mt-12">
          {/* Candidates */}
          <Card className="flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader className="pb-4">
              <Image
                src="/assets/user.png"
                alt="Candidates"
                width={83}
                height={83}
                className="h-[83px] w-[83px]"
                priority
              />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 space-y-3 w-full">
              <CardTitle className="text-xl font-semibold">
                {candidateQuery.data?.data?.title || "Candidates"}
              </CardTitle>
              <div
                className="text-gray-600 text-sm text-left leading-relaxed list-item list-none"
                dangerouslySetInnerHTML={{
                  __html: candidateQuery.data?.data?.description || "",
                }}
              />
            </CardContent>
          </Card>

          {/* Recruiters */}
          <Card className=" shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader className="pb-4 flex flex-col items-center">
              <Image
                src="/assets/explor.png"
                alt="Recruiters"
                width={83}
                height={83}
                className="h-[83px] w-[83px]"
              />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 space-y-3 w-full">
              <CardTitle className="text-xl font-semibold flex flex-col items-center">
                {recruiterQuery.data?.data?.title || "Recruiters"}
              </CardTitle>
              <div
                className="text-gray-600 text-sm text-left leading-relaxed list-item list-none"
                dangerouslySetInnerHTML={{
                  __html: recruiterQuery.data?.data?.description || "",
                }}
              />
            </CardContent>
          </Card>

          {/* Companies */}
          <Card className="flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader className="pb-4">
              <Image
                src="/assets/chair.png"
                alt="Companies"
                width={83}
                height={83}
                className="h-[83px] w-[83px]"
              />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 w-full">
              <CardTitle className="text-xl font-semibold">
                {companyQuery.data?.data?.title || "Companies"}
              </CardTitle>
              <div
                className="text-gray-600 text-sm text-left leading-relaxed list-item list-none"
                dangerouslySetInnerHTML={{
                  __html: companyQuery.data?.data?.description || "",
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
