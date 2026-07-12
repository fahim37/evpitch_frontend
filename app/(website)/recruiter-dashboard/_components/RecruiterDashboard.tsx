"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Eye, Mail, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import DOMPurify from "dompurify";
import { Input } from "@/components/ui/input";

// =============== Types ===============
interface ApplicationRequirement {
  requirement: string;
  _id: string;
}

interface CustomQuestion {
  question: string;
  _id: string;
}

interface Job {
  _id: string;
  userId: string;
  companyId: string;
  title: string;
  description: string;
  salaryRange: string;
  location: string;
  shift: string;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  vacancy: number;
  experience: number;
  adminApprove: boolean;
  deadline: string;
  applicantCount: number;
  status: string;
  jobCategoryId: string;
  derivedStatus: string;
  compensation: string;
  arcrivedJob: boolean;
  applicationRequirement: ApplicationRequirement[];
  customQuestion: CustomQuestion[];
  jobApprove: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  publishDate?: string;
}

interface JobApiResponse {
  success: boolean;
  message: string;
  data: Job[];
}

interface DeleteJobResponse {
  success: boolean;
  message: string;
  data: any;
}

interface SocialLink {
  label: string;
  url: string;
  _id: string;
}

interface Company {
  _id: string;
  userId: string;
  aboutUs: string;
  cname: string;
  clogo: string;
  country: string;
  city: string;
  zipcode: string;
  cemail: string;
  cPhoneNumber: string;
  links: string[];
  industry: string;
  service: string[];
  employeesId: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface slug {
  _id: string;
  slug: string;
}

interface RecruiterAccount {
  _id: string;
  userId: string;
  bio: string;
  photo: string;
  title: string;
  firstName: string;
  lastName: string;
  sureName: string;
  country: string;
  city: string;
  zipCode: string;
  slug: string;
  location: string;
  emailAddress: string;
  phoneNumber: string;
  roleAtCompany: string;
  awardTitle: string;
  programName: string;
  programDate: string;
  awardDescription: string;
  companyId?: Company;
  sLink: SocialLink[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  aboutUs: string;
}

interface RecruiterAccountResponse {
  success: boolean;
  message: string;
  data: RecruiterAccount;
}

interface PitchData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  video: {
    hlsUrl: string;
    encryptionKeyUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PitchApiResponse {
  success: boolean;
  message: string;
  total: number;
  data: PitchData[];
}

interface CompanyListItem {
  id: string;
  cname: string;
  clogo?: string;
}

interface CompaniesApiResponse {
  success: boolean;
  message: string;
  data: CompanyListItem[];
}

type PostingUsage = {
  usage?: {
    monthlyLimit?: number;
    monthlyUsed?: number;
    monthlyRemaining?: number;
    annualLimit?: number;
    annualUsed?: number;
    annualRemaining?: number;
  };
  plan?: {
    title?: string;
    valid?: string;
  };
};

// =============== Fetchers ===============
const apiBase = () => {
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
  }
  return process.env.NEXT_PUBLIC_BASE_URL;
};

const fetchRecruiterAccount = async (
  applicantId: string,
  token?: string
): Promise<RecruiterAccountResponse> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `${apiBase()}/recruiter/recruiter-account/${applicantId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

  const data: RecruiterAccountResponse = await res.json();
  if (!data.success)
    throw new Error(data.message || "Failed to fetch recruiter account");

  // Normalize oddly-shaped arrays that come down as JSON strings
  if (
    Array.isArray(data.data.companyId?.links) &&
    data.data.companyId?.links.length === 1
  ) {
    try {
      data.data.companyId.links = JSON.parse(data.data.companyId.links[0]);
    } catch (e) {
      console.warn("Failed to parse company links", e);
      (data.data.companyId as Company).links = [] as unknown as string[];
    }
  }
  if (
    Array.isArray(data.data.companyId?.service) &&
    data.data.companyId?.service.length === 1
  ) {
    try {
      data.data.companyId.service = JSON.parse(data.data.companyId.service[0]);
    } catch (e) {
      console.warn("Failed to parse company services", e);
      (data.data.companyId as Company).service = [] as unknown as string[];
    }
  }

  return data;
};

const fetchJobs = async (token?: string): Promise<JobApiResponse> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${apiBase()}/jobs/recruiter/company`, {
    method: "GET",
    headers,
  });

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  const data: JobApiResponse = await response.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch jobs");
  return data;
};

const fetchPitchData = async (
  userId: string,
  token?: string
): Promise<PitchApiResponse> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(
    `${apiBase()}/elevator-pitch/all/elevator-pitches?type=recruiter`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  const data: PitchApiResponse = await response.json();
  if (!data.success)
    throw new Error(data.message || "Failed to fetch pitch data");
  return data;
};

const fetchPostingUsage = async (token?: string): Promise<PostingUsage | null> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${apiBase()}/jobs/posting/usage`, {
    method: "GET",
    headers,
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data?.data ?? null;
};

const deleteJob = async (
  jobId: string,
  token?: string
): Promise<DeleteJobResponse> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${apiBase()}/jobs/${jobId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  const data: DeleteJobResponse = await response.json();
  if (!data.success) throw new Error(data.message || "Failed to delete job");
  return data;
};

const fetchCompanies = async (
  token?: string
): Promise<CompaniesApiResponse> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${apiBase()}/all/companies`, {
    method: "GET",
    headers,
  });

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  const data: CompaniesApiResponse = await response.json();
  if (!data.success)
    throw new Error(data.message || "Failed to fetch companies");
  return data;
};

const applyForCompanyEmployee = async (
  companyId: string,
  token?: string
): Promise<{ success: boolean; message: string }> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(
    `${apiBase()}/company/apply-for-company-employee`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ companyId }),
    }
  );

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  const data = await response.json();
  if (!data.success)
    throw new Error(data.message || "Failed to apply for company");
  return data;
};

const leaveCompany = async (
  companyId: string,
  token?: string
): Promise<{ success: boolean; message: string }> => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(
    `${apiBase()}/company/recruiter-leave-company`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ companyId }),
    }
  );

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  const data = await response.json();
  if (!data.success)
    throw new Error(data.message || "Failed to leave company");
  return data;
};

// =============== Component ===============
export default function RecruiterDashboard() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const userId = (session as any)?.user?.id as string | undefined;
  const queryClient = useQueryClient();
  const [companyQuery, setCompanyQuery] = useState("");


  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPageTable, setCurrentPageTable] = useState(1);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isApplicantWarningModalOpen, setIsApplicantWarningModalOpen] =
    useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  // NEW: archive confirmation state
  const [archiveJobId, setArchiveJobId] = useState<string | null>(null);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  const itemsPerPage = 4;

  // -------- Queries
  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
  } = useQuery<JobApiResponse, Error>({
    queryKey: ["jobs", userId, token],
    queryFn: () => fetchJobs(token),
    enabled: !!token, // prevents unauthenticated flashes
    refetchOnWindowFocus: false,
  });

  const { data: postingUsage } = useQuery<PostingUsage | null>({
    queryKey: ["postingUsage", token],
    queryFn: () => fetchPostingUsage(token),
    enabled: !!token,
    refetchOnWindowFocus: false,
  });

  const {
    data: recruiterAccount,
    isLoading: recruiterAccountLoading,
    error: recruiterAccountError,
  } = useQuery<RecruiterAccountResponse, Error>({
    queryKey: ["recruiter", (session as any)?.user?.id, token],
    queryFn: () => fetchRecruiterAccount((session as any)?.user?.id!, token),
    enabled: !!(session as any)?.user?.id && !!token,
    refetchOnWindowFocus: false,
  });

  const {
    data: pitchDataResponse,
    isLoading: pitchLoading,
    error: pitchError,
  } = useQuery<PitchApiResponse, Error>({
    queryKey: ["pitch", (session as any)?.user?.id, token],
    queryFn: () => fetchPitchData((session as any)?.user?.id!, token),
    enabled: !!(session as any)?.user?.id && !!token,
    refetchOnWindowFocus: false,
  });

  const {
    data: companiesData,
    isLoading: companiesLoading,
    error: companiesError,
  } = useQuery<CompaniesApiResponse, Error>({
    queryKey: ["companies", token],
    queryFn: () => fetchCompanies(token),
    enabled: isCompanyModalOpen && !!token,
    refetchOnWindowFocus: false,
  });

  // -------- Mutations
  const applyMutation = useMutation<
    { success: boolean; message: string },
    Error,
    string
  >({
    mutationFn: (companyId) => applyForCompanyEmployee(companyId, token),
    onSuccess: (data) => {
      toast.success(data.message || "Successfully applied to company");
      queryClient.invalidateQueries({ queryKey: ["recruiter"] });
      setIsCompanyModalOpen(false);
      setSelectedCompanyId(null);
    },
    onError: (error) =>
      toast.error(error.message || "Failed to apply to company"),
  });

  const leaveMutation = useMutation<
    { success: boolean; message: string },
    Error,
    string
  >({
    mutationFn: (companyId) => leaveCompany(companyId, token),
    onSuccess: (data) => {
      toast.success(data.message || "Left company successfully");
      queryClient.invalidateQueries({ queryKey: ["recruiter"] });
      setIsLeaveConfirmOpen(false);
    },
    onError: (error) =>
      toast.error(error.message || "Failed to leave company"),
  });

  const deleteMutation = useMutation<DeleteJobResponse, Error, string>({
    mutationFn: (jobId) => deleteJob(jobId, token),
    onSuccess: (data) => {
      toast.success(data.message || "Job deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setIsDeleteModalOpen(false);
      setDeleteJobId(null);
    },
    onError: (error) => toast.error(error.message || "Failed to delete job"),
  });

  // -------- Derived state
  const [sanitizedContent, setSanitizedContent] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const content =
        recruiterAccount?.data?.companyId?.aboutUs ??
        recruiterAccount?.data?.bio ??
        "";
      setSanitizedContent(DOMPurify.sanitize(content));
    }
  }, [recruiterAccount?.data?.companyId?.aboutUs, recruiterAccount?.data?.bio]);


  const filteredCompanies = useMemo(() => {
  const q = companyQuery.trim().toLowerCase();
  if (!q) return companiesData?.data ?? [];
  return (companiesData?.data ?? []).filter((c) =>
    c.cname?.toLowerCase().includes(q)
  );
}, [companiesData?.data, companyQuery]);


  const formatDate = (dateString?: string): string => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const jobs = jobsData?.data ?? [];
  const totalPagesTable = Math.max(1, Math.ceil(jobs.length / itemsPerPage));
  const startIndexTable = (currentPageTable - 1) * itemsPerPage;
  const endIndexTable = startIndexTable + itemsPerPage;
  const currentJobsTable = useMemo(
    () => jobs.slice(startIndexTable, endIndexTable),
    [jobs, startIndexTable, endIndexTable]
  );
  const monthlyLimit = postingUsage?.usage?.monthlyLimit;
  const monthlyUsed = postingUsage?.usage?.monthlyUsed ?? jobs.length;
  const monthlyRemaining = postingUsage?.usage?.monthlyRemaining;
  const annualLimit = postingUsage?.usage?.annualLimit;
  const annualUsed = postingUsage?.usage?.annualUsed ?? jobs.length;
  const annualRemaining = postingUsage?.usage?.annualRemaining;
  const planLabel = postingUsage?.plan?.title || postingUsage?.plan?.valid;

  // -------- Handlers
  const handlePageChangeTable = (page: number) => setCurrentPageTable(page);
  const handlePreviousTable = () =>
    setCurrentPageTable((p) => Math.max(1, p - 1));
  const handleNextTable = () =>
    setCurrentPageTable((p) => Math.min(totalPagesTable, p + 1));

  const toggleArchive = async (jobId: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${jobId}/archive`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // if required
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to update archive status");
    }

    const data = await res.json();
    return data; // assume response includes updated job with arcrivedJob field
  };

  const { mutate: handleArchive, isPending: isArchiving } = useMutation({
    mutationFn: toggleArchive,
    onSuccess: (data) => {
      if (data?.arcrivedJob === true) {
        toast.success("Job archived successfully!");
      } else if (data?.arcrivedJob === false) {
        toast.success("Job unarchived successfully!");
      }
      setArchiveJobId(null);
      setIsArchiveConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["jobs", userId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Something went wrong");
      setArchiveJobId(null);
      setIsArchiveConfirmOpen(false);
    },
  });

  const handleConfirmDelete = () =>
    deleteJobId && deleteMutation.mutate(deleteJobId);

  const handleConnectWithCompany = () => {
    setIsCompanyModalOpen(true);
    setIsDrawerOpen(false);
  };

  const handleSelectCompany = (companyId: string) =>
    setSelectedCompanyId(companyId);
  const handleConfirmApply = () =>
    selectedCompanyId
      ? applyMutation.mutate(selectedCompanyId)
      : toast.error("Please select a company.");
  const handleRequestLeave = () => setIsLeaveConfirmOpen(true);
  const handleConfirmLeave = () => {
    const companyId = recruiterAccount?.data?.companyId?._id;
    if (!companyId) {
      toast.error("No company to leave.");
      return;
    }
    leaveMutation.mutate(companyId);
  };

  // NEW: open archive confirmation if job has applicants and we are archiving (not unarchiving)
  const requestArchive = (job: Job) => {
    if (job.applicantCount > 0 && !job.arcrivedJob) {
      setArchiveJobId(job._id);
      setIsArchiveConfirmOpen(true);
      return;
    }
    handleArchive(job._id);
  };



 
  // =============== UI ===============
  return (
    <div className="min-h-screen py-6 md:py-8 px-4 md:px-6 lg:px-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-4xl text-[#131313] font-bold text-center mb-8 md:mb-12">
          Recruiter Dashboard
        </h1>

        {postingUsage && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-700 font-medium">Plan</p>
              <p className="text-lg font-semibold text-blue-900">
                {planLabel || "Current plan"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600 font-medium">Posted (month)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {monthlyUsed} / {monthlyLimit ?? "auto"}
              </p>
              <p className="text-xs text-gray-500">
                Remaining: {monthlyRemaining ?? "auto"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600 font-medium">Posted (year)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {annualUsed} / {annualLimit ?? "auto"}
              </p>
              <p className="text-xs text-gray-500">
                Remaining: {annualRemaining ?? "auto"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600 font-medium">Total Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">{jobs.length}</p>
            </div>
          </div>
        )}

        {/* Recruiter / Company Info */}
        <section className="mb-8 md:mb-12 bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-[#E5E7EB] pb-3">
            <h2 className="text-xl md:text-2xl font-bold text-[#131313]">
              {recruiterAccount?.data?.companyId?._id
                ? "Company Information"
                : "Recruiter Information"}
            </h2>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2 md:gap-3">
              {!recruiterAccount?.data?.companyId?._id && (
                <Button
                  onClick={handleConnectWithCompany}
                  className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/85 text-white px-4 md:px-6 py-2 md:py-3 text-sm md:text-base shadow-md"
                >
                  Connect with a Company
                </Button>
              )}
              {recruiterAccount?.data?.companyId?._id && (
                <Button
                  variant="outline"
                  onClick={handleRequestLeave}
                  disabled={leaveMutation.isPending}
                  className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base border-red-200 text-red-700 hover:bg-red-50"
                >
                  {leaveMutation.isPending ? "Leaving..." : "Leave Company"}
                </Button>
              )}
              <Link
                href={`/rp/${encodeURIComponent(
                  recruiterAccount?.data?.slug ?? ""
                )}`}
              >
                <Button
                  disabled={!recruiterAccount?.data?.slug}
                  className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/85 text-white px-4 md:px-6 py-2 md:py-3 text-sm md:text-base shadow-md"
                >
                  Public view
                </Button>
              </Link>
              <Link href="/add-job">
                <Button className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/85 text-white px-4 md:px-6 py-2 md:py-3 text-sm md:text-base shadow-md">
                  Post A Job
                </Button>
              </Link>
            </div>

            {/* Mobile menu */}
            <div className="md:hidden">
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-2"
                    aria-label="Open settings menu"
                  >
                    <Settings className="h-6 w-6 text-[#2B7FD0]" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                  <DrawerTitle>Menu</DrawerTitle>
                  </DrawerHeader>
                  <div className="flex flex-col gap-3 p-4">
                    {!recruiterAccount?.data?.companyId?._id && (
                      <Button
                        onClick={handleConnectWithCompany}
                        className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/85 text-white py-3 text-base"
                      >
                        Connect with a Company
                      </Button>
                    )}
                    {recruiterAccount?.data?.companyId?._id && (
                      <Button
                        variant="outline"
                        onClick={handleRequestLeave}
                        disabled={leaveMutation.isPending}
                        className="py-3 text-base border-red-200 text-red-700 hover:bg-red-50"
                      >
                        {leaveMutation.isPending ? "Leaving..." : "Leave Company"}
                      </Button>
                    )}
                    <Link
                      href={`/rp/${encodeURIComponent(
                        recruiterAccount?.data?.slug ?? "")}`}
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      <Button
                        disabled={!recruiterAccount?.data?.slug}
                        className="w-full bg-[#2B7FD0] hover:bg-[#2B7FD0]/85 text-white py-3 text-base"
                      >
                        Public view
                      </Button>
                    </Link>
                    <Link
                      href="/add-job"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      <Button className="w-full bg-[#2B7FD0] hover:bg-[#2B7FD0]/85 text-white py-3 text-base">
                        Post A Job
                      </Button>
                    </Link>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          {/* Info Body */}
          {recruiterAccountLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <div className="col-span-1 lg:col-span-2">
                <div className="md:flex gap-3">
                  <Skeleton className="w-[120px] h-[120px] md:w-[170px] md:h-[170px]" />
                  <div className="space-y-3 mt-3 md:mt-0">
                    <div>
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-1 lg:col-span-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-20 w-full mt-2" />
              </div>
            </div>
          ) : recruiterAccountError ? (
            <div className="text-center text-red-500">
              Please complete your profile to access the dashboard.
              <Button
                variant="outline"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["recruiter", (session as any)?.user?.id, token],
                  })
                }
                className="ml-4"
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
              <div className="col-span-1 md:col-span-3">
                <div className="flex gap-3">
                  {recruiterAccount?.data?.companyId?.clogo ||
                  recruiterAccount?.data?.photo ? (
                    <Image
                      src={
                        recruiterAccount?.data?.companyId?.clogo ||
                        recruiterAccount?.data?.photo ||
                        "/placeholder.png"
                      }
                      alt={
                        recruiterAccount?.data?.companyId
                          ? "Company Logo"
                          : "Recruiter Photo"
                      }
                      width={170}
                      height={170}
                      className="mt-1 w-[120px] h-[120px] md:w-[170px] md:h-[170px] object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-[120px] h-[120px] md:w-[170px] md:h-[170px] bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg">
                      No Image
                    </div>
                  )}
                  <div className="space-y-2 md:space-y-3">
                    <div>
                      <div className="font-semibold text-lg md:text-xl text-[#000000] truncate max-w-[220px] md:max-w-none">
                        {`${recruiterAccount?.data?.firstName} ${recruiterAccount?.data?.sureName}`}
                      </div>
                      {recruiterAccount?.data?.companyId && (
                        <div className="text-sm md:text-base text-blue-600 truncate max-w-[220px] md:max-w-none">
                          {recruiterAccount?.data?.companyId.cname}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <Mail className="text-gray-600 h-5 w-5 shrink-0" />
                      <p className="text-sm md:text-base text-gray-700 break-all">
                        {recruiterAccount?.data?.emailAddress ??
                          "No email available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-1 md:col-span-4">
                <div className="font-semibold text-lg md:text-xl text-[#000000]">
                  About {recruiterAccount?.data?.companyId ? "Us" : "Me"}
                </div>
                {sanitizedContent ? (
                  <div
                    className="text-gray-700 mt-2 prose max-w-none list-item list-none"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  />
                ) : (
                  <p className="text-gray-700 mt-2">
                    No description available.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Your Jobs */}
        <section className="mb-8 md:mb-12 bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl text-[#000000] font-semibold">
              Your Jobs
            </h2>
          </div>

          {jobsError && (
            <div className="text-center text-red-600 mb-4">
              Error loading jobs: {jobsError.message}
              <Button
                variant="outline"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["jobs"] })
                }
                className="ml-4"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Mobile list */}
          <div className="md:hidden">
            {jobsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: itemsPerPage }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : currentJobsTable.length > 0 ? (
              <div className="space-y-3">
                {currentJobsTable.map((job) => (
                  <div key={job._id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-base text-[#000000] line-clamp-2">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Status: {job.derivedStatus}
                        </p>
                        <p className="text-sm text-gray-600">
                          Posted: {formatDate(job.publishDate)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Deadline: {formatDate(job.deadline)}
                        </p>
                        <Link
                          href={`/candidate-list/${job._id}`}
                          className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View applicants{" "}
                          <span className="text-gray-500">
                            ({job.applicantCount})
                          </span>
                        </Link>
                      </div>
                      <div className="flex flex-col items-center gap-3 shrink-0">
                        <Link
                          href={`/single-job/${job._id}`}
                          aria-label={`View job ${job.title}`}
                          className="text-[#000000] hover:text-blue-600"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => requestArchive(job)}
                          className={`cursor-pointer transition px-3 rounded ${
                            job.arcrivedJob
                              ? "bg-red-100 text-red-600 hover:bg-red-200"
                              : "bg-green-100 text-green-600 hover:bg-green-200"
                          } ${
                            isArchiving ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          {isArchiving
                            ? "Processing..."
                            : job.arcrivedJob
                            ? "Unarchive"
                            : "Archive"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">No jobs found.</div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-lg w-full overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm md:text-base text-[#2B7FD0] font-bold">
                    Job Title
                  </TableHead>
                  <TableHead className="text-sm md:text-base text-[#2B7FD0] font-bold">
                    Status
                  </TableHead>
                  <TableHead className="text-sm md:text-base text-[#2B7FD0] font-bold">
                    Ordered
                  </TableHead>
                  <TableHead className="text-sm md:text-base text-[#2B7FD0] font-bold">
                    Published
                  </TableHead>
                  <TableHead className="text-sm md:text-base text-[#2B7FD0] font-bold">
                    Expiry
                  </TableHead>
                  <TableHead className="text-sm md:text-base text-[#2B7FD0] font-bold">
                    Applicants
                  </TableHead>
                  <TableHead className="text-sm md:text-base text-[#2B7FD0] font-bold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsLoading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-6 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentJobsTable.length > 0 ? (
                  currentJobsTable.map((job: Job) => (
                    <TableRow
                      key={job._id}
                      className="text-sm md:text-base text-[#000000] font-medium"
                    >
                      <TableCell
                        className="font-medium max-w-[320px] truncate"
                        title={job.title}
                      >
                        {job.title}
                      </TableCell>
                      <TableCell>{job.derivedStatus}</TableCell>
                      <TableCell>{formatDate(job.createdAt)}</TableCell>

                      <TableCell>{formatDate(job.publishDate)}</TableCell>

                      <TableCell>{formatDate(job.deadline)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/candidate-list/${job._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View{" "}
                          <span className="text-gray-500">
                            ({job.applicantCount})
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="flex items-center gap-4">
                        <Link
                          href={`/single-job/${job._id}`}
                          className="text-[#000000] hover:text-blue-600 transition-colors"
                          aria-label={`View job ${job.title}`}
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => requestArchive(job)}
                          className={`cursor-pointer transition px-3 rounded ${
                            job.arcrivedJob
                              ? "bg-red-100 text-red-600 hover:bg-red-200"
                              : "bg-green-100 text-green-600 hover:bg-green-200"
                          } ${
                            isArchiving ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          {isArchiving
                            ? "Processing..."
                            : job.arcrivedJob
                            ? "Unarchive"
                            : "Archive"}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No jobs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {jobs.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={handlePreviousTable}
                disabled={currentPageTable === 1}
                className="flex items-center gap-2 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPagesTable }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={
                        currentPageTable === page ? "default" : "outline"
                      }
                      onClick={() => handlePageChangeTable(page)}
                      className="w-9 h-9 md:w-10 md:h-10"
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleNextTable}
                disabled={currentPageTable === totalPagesTable}
                className="flex items-center gap-2 bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>

        {/* Company Selection Modal */}
        {/* Company Selection Modal */}
        <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Connect with a Company</DialogTitle>
              <DialogDescription>
                Select a company to connect with as an employee.
              </DialogDescription>
            </DialogHeader>

            {/* Search */}
            <div className="mb-3">
              <Input
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                placeholder="Search companies by name…"
                aria-label="Search companies by name"
              />
              {!!companiesData?.data?.length && (
                <p className="mt-1 text-xs text-gray-500">
                  Showing {filteredCompanies.length} of{" "}
                  {companiesData.data.length}
                </p>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {companiesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : companiesError ? (
                <div className="text-center text-red-500">
                  Error: {companiesError.message}
                  <Button
                    variant="outline"
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: ["companies", token],
                      })
                    }
                    className="ml-4"
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredCompanies.length ? (
                <div className="space-y-2">
                  {filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      className={`w-full text-left p-3 md:p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedCompanyId === company.id
                          ? "bg-gray-100 border-gray-300"
                          : ""
                      }`}
                      onClick={() => setSelectedCompanyId(company.id)}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        {company.clogo ? (
                          <Image
                            src={company.clogo}
                            alt={`${company.cname} logo`}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200" />
                        )}
                        <span className="text-sm md:text-base font-medium truncate">
                          {company.cname}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  {companyQuery
                    ? "No companies match your search."
                    : "No companies available."}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCompanyModalOpen(false);
                  setSelectedCompanyId(null);
                  setCompanyQuery(""); // clear search on close
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  selectedCompanyId
                    ? applyMutation.mutate(selectedCompanyId)
                    : toast.error("Please select a company.")
                }
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Applying...
                  </span>
                ) : (
                  "Connect"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Leave company confirmation */}
        <Dialog open={isLeaveConfirmOpen} onOpenChange={setIsLeaveConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave company?</DialogTitle>
              <DialogDescription>
                You will be disconnected from this company and your future job posts will no longer link to it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsLeaveConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmLeave}
                disabled={leaveMutation.isPending}
              >
                {leaveMutation.isPending ? "Leaving..." : "Leave company"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Applicant warning modal (for deletion) */}
        <Dialog
          open={isApplicantWarningModalOpen}
          onOpenChange={setIsApplicantWarningModalOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update applicants before deletion</DialogTitle>
              <DialogDescription>
                Kindly remember to update each applicant on the final status of
                their application, using our intuitive one-click feedback tool
                in your job applicants panel.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsApplicantWarningModalOpen(false);
                  setDeleteJobId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  deleteJobId && deleteMutation.mutate(deleteJobId)
                }
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Job Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this job? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteJobId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  deleteJobId && deleteMutation.mutate(deleteJobId)
                }
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* NEW: Archive Confirmation Modal */}
        <Dialog
          open={isArchiveConfirmOpen}
          onOpenChange={setIsArchiveConfirmOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Before you archive this job</DialogTitle>
              <DialogDescription>
                Kindly remember to update each applicant on the final status of
                their application, using our intuitive one-click feedback tool
                in your job applicants panel.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsArchiveConfirmOpen(false);
                  setArchiveJobId(null);
                }}
                disabled={isArchiving}
              >
                No
              </Button>
              <Button
                onClick={() => archiveJobId && handleArchive(archiveJobId)}
                disabled={isArchiving}
              >
                {isArchiving ? "Processing..." : "Yes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
