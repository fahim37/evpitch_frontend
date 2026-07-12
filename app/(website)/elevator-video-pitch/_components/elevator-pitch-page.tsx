"use client";

import { useEffect, useState } from "react";
import CreateResumeForm from "./create-resume-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCompanyAccount,
  getMyResume,
  getRecruiterAccount,
  updateResume,
} from "@/lib/api-service";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CompanyProfilePage from "./company-profile";
import CreateCompanyPage from "./create-company";
import { Card, CardContent } from "@/components/ui/card";
import MyResume from "./resume";
import UpdateResumeForm from "./update-resume-form";
import EditableRecruiterAccount from "./editable-recruiter-account";
import CreateRecruiterAccount from "./create-recruiter-account";
import { Skeleton } from "@/components/ui/skeleton";

export default function ElevatorPitchAndResume() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const role = session?.user?.role;
  const userId = session?.user?.id;

  // Resume query (only if role is candidate)
  const { data: myresume, isLoading: resumeLoading } = useQuery({
    queryKey: ["my-resume"],
    queryFn: getMyResume,
    select: (data) => data?.data,
    enabled: role === "candidate" && !!userId,
  });

  // Recruiter query (only if role is recruiter)
  const { data: recruiter, isLoading: recruiterLoading } = useQuery({
    queryKey: ["recruiter", userId],
    queryFn: () => getRecruiterAccount(userId || ""),
    select: (data) => data?.data,
    enabled: role === "recruiter" && !!userId,
  });

  // Company query (only if role is neither candidate nor recruiter)
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company-account", userId],
    queryFn: () => getCompanyAccount(userId || ""),
    select: (data) => data?.data,
    enabled: role !== "candidate" && role !== "recruiter" && !!userId,
  });

  const handleUpdate = async (data: FormData) => {
    try {
      await updateResume(data);
      queryClient.invalidateQueries({ queryKey: ["my-resume"] });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update resume:", error);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [router, status]);

  if (status === "loading") return <LoadingSkeleton />;
  if (status === "unauthenticated") return null;


  if (resumeLoading || recruiterLoading || companyLoading)
    return <LoadingSkeleton />;

  return (
    <section className="">
      <div className="lg:container lg:mx-auto lg:px-6">
        {role === "candidate" ? (
          myresume?.resume ? (
            isEditing ? (
              <UpdateResumeForm
                resume={myresume}
                onCancel={() => setIsEditing(false)}
                onUpdate={handleUpdate}
              />
            ) : (
              <MyResume resume={myresume} onEdit={() => setIsEditing(true)} />
            )
          ) : (
            <CreateResumeForm />
          )
        ) : role === "recruiter" ? (
          recruiter ? (
            <div className="lg:space-y-16 space-y-6">
              <EditableRecruiterAccount recruiter={recruiter} />
            </div>
          ) : (
            <CreateRecruiterAccount />
          )
        ) : Array.isArray(company?.companies) &&
          company.companies.length > 0 ? (
          <CompanyProfilePage userId={userId} />
        ) : (
          <CreateCompanyPage />
        )}
      </div>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <section className="py-8 lg:py-20">
      <div className="container mx-auto lg:px-6 space-y-6">
        {[...Array(3)].map((_, idx) => (
          <Card key={idx}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
        {[...Array(3)].map((_, idx) => (
          <Card key={`b-${idx}`}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
