"use client";

import { useParams } from "next/navigation";
import RecruiterListPage from "./_components/recruiterListPage";

function RecruiterListWrapper() {
  const params = useParams<{ companyId: string }>();
  const companyId = params.companyId;


  return (
    <div>
      <RecruiterListPage companyId={companyId} />
    </div>
  );
}

export default RecruiterListWrapper;