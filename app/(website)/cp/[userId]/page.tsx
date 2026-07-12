import React from "react";
import Candidates from "../_components/candidates";

interface PageProps {
  params: Promise<{ userId: string }>; // params is a Promise in Next.js App Router
}

export default async function Page({ params }: PageProps) {
  const { userId } = await params;

  return (
    <div className="">
      <Candidates userId={userId} />
    </div>
  );
}
