import React from "react";
import EditCompanyPage from "../../_components/edit-company-profile";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  const { id } = await params;

  return (
    <div>
      <EditCompanyPage companyId={id} />
    </div>
  );
};

export default Page;
