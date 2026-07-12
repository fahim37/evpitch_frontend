"use client";
import type React from "react";
import { ProfileSidebar } from "./_components/profile-sidebar";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  // Redirect to login if unauthenticated
  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {status === "authenticated" && <ProfileSidebar />}
        <main role="main" className="flex-1 lg:mt-0">
          {
            children
          }
        </main>
      </div>
    </div>
  );
}