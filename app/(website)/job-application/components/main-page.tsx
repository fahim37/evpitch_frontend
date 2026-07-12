"use client";

import { useSearchParams } from "next/navigation";
import JobApplicationPage from "./job-application-page";

export default function ClientJobApplication() {
    const searchParams = useSearchParams();
    const jobId = searchParams.get("id") || "";

    return <JobApplicationPage jobId={jobId} />;
}
