import React from "react";
import Recruiters from "../_components/recruiters";

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

async function Page({ params }: PageProps) {
  const { userId } = await params; // ✅ await params here

  return (
    <div>
      <Recruiters userId={userId} />
    </div>
  );
}

export default Page;
