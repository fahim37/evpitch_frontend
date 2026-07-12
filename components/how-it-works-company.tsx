"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export function HowItWorksCompany() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const router = useRouter();

  const handleCreateAccountClick = () => {
    if (!token) {
      router.push("/login");
    } else {
      router.push("/elevator-video-pitch");
    }
  };

  return (
    <section className="w-full py-10 md:py-16 bg-gray-50">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px] text-[#000000]">
          How It Works in three simple steps (Company)
        </h2>
        <div className="w-[785px] h-[4px] bg-[#2B7FD0] rounded-[35px] mt-4"></div>

        <div className="md:text-xl">
          <ol className="list-decimal list-inside space-y-1 text-[#707070] font-medium justify-start mt-[32px]">
            <li>
              Record or upload your video elevator pitch (60 seconds free or
              upgrade!)
            </li>
            <li>Add a link to your video elevator pitch in your CV/resume</li>
            <li>Search and apply for jobs on our site</li>
          </ol>
        </div>
        <div className="grid gap-8 md:grid-cols-3 mt-12">
          <Card
            className="flex flex-col items-center lg:p-6 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer h-[300px]" // Fixed height
            onClick={handleCreateAccountClick}
          >
            <CardHeader className="pb-4">
              <Image
                src="/assets/user.png"
                alt="UserPlus"
                width={1000}
                height={1000}
                className="h-[83px] w-[83px]"
              />
            </CardHeader>
            <CardContent className="space-y-2 flex flex-col justify-between flex-1">
              {" "}
              {/* Flex to fill height */}
              <div>
                <CardTitle className="text-xl font-semibold">
                  Create Account
                </CardTitle>
                <p className="text-gray-500">
                  Sign up in seconds and build your profile to start your job
                  search journey.
                </p>
              </div>
            </CardContent>
          </Card>
          <Link href="/alljobs">
            <Card className="flex flex-col items-center lg:p-6 text-center shadow-sm hover:shadow-md transition-shadow h-[300px]">
              {" "}
              {/* Fixed height */}
              <CardHeader className="pb-4">
                <Image
                  src="/assets/explor.png"
                  alt="UserPlus"
                  width={1000}
                  height={1000}
                  className="h-[83px] w-[83px]"
                />
              </CardHeader>
              <CardContent className="space-y-2 flex flex-col justify-between flex-1">
                {" "}
                {/* Flex to fill height */}
                <div>
                  <CardTitle className="text-xl font-semibold">
                    Explore Our Jobs
                  </CardTitle>
                  <p className="text-gray-500">
                    Explore thousands of job listings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/elevator-video-pitch">
            <Card className="flex flex-col items-center lg:p-6 text-center shadow-sm hover:shadow-md transition-shadow h-[300px]">
              {" "}
              {/* Fixed height */}
              <CardHeader className="pb-4">
                <Image
                  src="/assets/chair.png"
                  alt="UserPlus"
                  width={1000}
                  height={1000}
                  className="h-[83px] w-[83px]"
                />
              </CardHeader>
              <CardContent className="space-y-2 flex flex-col justify-between flex-1">
                {" "}
                {/* Flex to fill height */}
                <div>
                  <CardTitle className="text-xl font-semibold">
                    Get A Job
                  </CardTitle>
                  <p className="text-gray-500">
                    Apply with ease, follow recruiters, and land your next
                    opportunity.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </section>
  );
}
