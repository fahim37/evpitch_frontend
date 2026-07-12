"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Sparkles } from "lucide-react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { useState, MouseEvent, KeyboardEvent } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { getMyResume } from "@/lib/api-service";
import { DescriptionClamp } from "@/components/DescriptionClamp";

interface Recruiter {
  _id: string;
  firstName: string;
  sureName: string;
  slug?: string;
  photo?: string;
  userId: string;
}
interface CompanyId {
  _id?: string;
  cname?: string;
  slug?: string;
  clogo?: string;
  userId?: string;
}
interface Job {
  _id: string;
  title?: string;
  description?: string;
  salaryRange?: string;
  location?: string;
  location_Type?: string;
  shift?: string;
  employement_Type?: string;
  companyId?: CompanyId;
  recruiterId?: Recruiter;
  vacancy?: number;
  experience?: number;
  compensation?: string;
  createdAt?: string;
  applicantCount?: number;
  counter?: number;
  updatedAt?: string;
}
interface JobFitInsight {
  score: number;
  verdictCode: string;
  verdictMessage: string;
  aiSummary?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  jobSkills?: string[];
  profileSkills?: string[];
}
interface JobCardProps {
  job: Job;
  variant: "suggested" | "list";
  className?: string;
  applicantCount?: number;
  onToggleBookmark?: () => void;
  bookmarkLoading?: boolean;
}

const FIT_THEMES: Record<
  string,
  { bg: string; text: string; chip: string; accent: string }
> = {
  STRONG_MATCH: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    chip: "bg-white/70 text-emerald-700",
    accent: "text-emerald-500",
  },
  PARTIAL_MATCH: {
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    chip: "bg-white/70 text-cyan-700",
    accent: "text-cyan-500",
  },
  MISSING_SOME: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    chip: "bg-white/70 text-amber-700",
    accent: "text-amber-500",
  },
  MISSING_MOST: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    chip: "bg-white/70 text-rose-700",
    accent: "text-rose-500",
  },
};

export default function JobCard({
  job,
  variant,
  className,
  applicantCount,
}: JobCardProps) {
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [fitExpanded, setFitExpanded] = useState(false);
  const [jobFit, setJobFit] = useState<JobFitInsight | null>(null);
  const [jobFitLoading, setJobFitLoading] = useState(false);
  const [jobFitError, setJobFitError] = useState<string | null>(null);
  const router = useRouter();

  const role = (session?.user as any)?.role as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;
  const token = session?.accessToken as string | undefined;

  const isUnauthed = status === "unauthenticated";
  const isCandidate = role === "candidate";
  const isRecruiterOrCompany = role === "recruiter" || role === "company";
  const canSeeApply = isUnauthed || isCandidate;

  const applicationLink = `/job-application?id=${job._id}`;
  const detailsLink = `/alljobs/${job._id}`;

  const derivedApplicantCount =
    typeof applicantCount === "number"
      ? applicantCount
      : job.applicantCount ?? (job as any)?.counter;

  const applicantLabel =
    typeof derivedApplicantCount === "number"
      ? `${derivedApplicantCount} ${
          derivedApplicantCount === 1 ? "applicant" : "applicants"
        }`
      : null;

  const fitTheme =
    FIT_THEMES[jobFit?.verdictCode ?? ""] ??
    FIT_THEMES.PARTIAL_MATCH ??
    FIT_THEMES.STRONG_MATCH;

  // ===== Resume (only for candidates) =====
  const { data: myresume, isLoading: resumeLoading } = useQuery({
    queryKey: ["my-resume", userId],
    queryFn: getMyResume,
    select: (res) => res?.data,
    enabled: isCandidate && !!userId,
    staleTime: 60_000,
  });

  const TOAST_DURATION_MS = 2200;
  const REDIRECT_DELAY_MS = 2000;

  // ===== Apply =====
  const handleUnauthedApply = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isRedirecting) return;
    setIsRedirecting(true);
    toast("Please log in as a candidate to apply", {
      description: "You’ll now be redirected to sign in.",
      duration: TOAST_DURATION_MS,
    });
    setTimeout(() => {
      void signIn(undefined, { callbackUrl: applicationLink });
    }, 1800);
  };

  const handleCandidateApply = (e: MouseEvent) => {
    e.stopPropagation();
    if (resumeLoading || isRedirecting) return;

    const hasEVP =
      Array.isArray(myresume?.elevatorPitch) &&
      myresume!.elevatorPitch.length > 0;

    if (!hasEVP) {
      setIsRedirecting(true);
      toast("Elevator Pitch Required", {
        description:
          "You need to have an Elevator Pitch video to apply for jobs. Redirecting you to set it up.",
        duration: TOAST_DURATION_MS,
      });
      setTimeout(() => {
        router.push("/elevator-video-pitch");
      }, REDIRECT_DELAY_MS);
      return;
    }

    router.push(applicationLink);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ===== postedBy =====
  let postedByName = "company";
  let postedByLogo = "/default-logo.png";
  let postedById = "#";
  let postedByType: "company" | "recruiter" = "company";

  if (job.recruiterId) {
    postedByName = `${job.recruiterId.firstName} ${job.recruiterId.sureName}`;
    postedByLogo = job.recruiterId.photo || "/default-logo.png";
    postedById = job.recruiterId.slug || "#";
    postedByType = "recruiter";
  } else if (job.companyId) {
    postedByName = job.companyId.cname || "Unknown Company";
    postedByLogo = job.companyId.clogo || "/default-logo.png";
    postedById = job.companyId.slug || "#";
    postedByType = "company";
  }

  const CompanyAvatar = () => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        router.push(detailsLink);
      }}
      className="relative shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/60"
      aria-label="Open job details"
    >
      {postedByLogo !== "/default-logo.png" ? (
        <Image
          src={postedByLogo}
          alt={postedByType === "recruiter" ? "Recruiter Photo" : "Company Logo"}
          width={56}
          height={56}
          className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-cover"
          sizes="(max-width: 768px) 40px, 48px"
        />
      ) : (
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-blue-100 text-gray-700 grid place-items-center font-semibold">
          {getInitials(postedByName)}
        </div>
      )}
    </button>
  );

  const navigateToPosterProfile = (e: MouseEvent | KeyboardEvent) => {
    // @ts-ignore
    e.stopPropagation?.();
    if ("key" in e) {
      const key = (e as KeyboardEvent).key;
      if (key !== "Enter" && key !== " ") return;
    }
    const profilePath =
      postedByType === "recruiter" ? `/rp/${postedById}` : `/cmp/${postedById}`;
    router.push(profilePath);
  };

  // ===== Job fit =====
  const analyzeAndOpen = () => {
    if (!isCandidate) {
      setJobFitError("Profile fit is available for candidates only.");
      setFitExpanded(true);
      return;
    }
    if (!jobFit && !jobFitLoading) {
      void (async () => {
        try {
          if (!token) {
            setJobFitError("Sign in to check your profile fit for this role.");
            setFitExpanded(true);
            return;
          }
          setJobFitLoading(true);
          setJobFitError(null);
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${job._id}/ai-fit`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) throw new Error("Unable to fetch fit insight");
          const payload = await res.json();
          if (payload?.data) setJobFit(payload.data as JobFitInsight);
          else setJobFitError("No insight available for this position right now.");
        } catch (err: any) {
          setJobFitError(err?.message ?? "Something went wrong while checking profile fit.");
        } finally {
          setJobFitLoading(false);
        }
      })();
    }
    setFitExpanded(true);
  };

  const renderFitBadge = () => {
    if (!isCandidate) return null;
    const theme = fitTheme;

    // Entire bar is clickable/keyboard-activatable
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          analyzeAndOpen();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            analyzeAndOpen();
          }
        }}
        aria-expanded={fitExpanded}
        className={clsx(
          "w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary/30",
          jobFit ? `${theme.bg} ${theme.text}` : "bg-slate-100 text-slate-700"
        )}
      >
        <Sparkles className={clsx("h-4 w-4", theme.accent)} />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wide text-gray-500">
            Profile fit
          </span>
          <span className="text-sm font-semibold">
            {jobFit
              ? jobFit.verdictMessage
              : jobFitLoading
              ? "Checking…"
              : jobFitError
              ? "Fit unavailable"
              : "Check your fit"}
          </span>
        </div>

        {jobFit && (
          <span
            className={clsx(
              "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold",
              theme.chip
            )}
          >
            {Math.round(jobFit.score)}%
          </span>
        )}

        {/* Visual Analyze chip (clicking anywhere still works) */}
        {!jobFit && (
          <span
            className={clsx(
              "ml-auto text-xs sm:text-sm rounded-md border px-2 py-1",
              jobFitLoading ? "opacity-60" : "border-slate-300 text-slate-700"
            )}
          >
            {jobFitLoading ? "Analyzing…" : "Analyze"}
          </span>
        )}
      </button>
    );
  };

  const renderApplicantBadge = () => {
    if (typeof derivedApplicantCount !== "number") return null;
    return (
      <div className="flex items-center gap-2 rounded-lg bg-[#E9ECFC] px-2.5 py-1.5 text-sm text-slate-700">
        <Users className="h-4 w-4 text-slate-500" />
        <span className="font-medium">{applicantLabel}</span>
      </div>
    );
  };

  const renderSkillPills = (
    title: string,
    items: string[],
    emptyText: string
  ) => (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.slice(0, 14).map((skill) => (
            <span
              key={`${title}-${skill}`}
              className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-700"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );

  const renderFitDetailsPanel = () => {
    if (!isCandidate) return null;
    return (
      <AnimatePresence initial={false}>
        {fitExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white/70 p-4 shadow-inner"
          >
            {jobFitLoading && (
              <p className="text-sm text-muted-foreground">Checking fit...</p>
            )}
            {jobFitError && (
              <p className="text-sm text-rose-600">{jobFitError}</p>
            )}
            {jobFit && !jobFitLoading && (
              <div className="space-y-5">
                {/* Score */}
                <div className="flex flex-wrap items-center justify-center gap-4 bg-primary/5 rounded-lg py-3 px-4 shadow-sm">
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">
                      Score
                    </p>
                    <motion.p
                      className="text-3xl font-bold text-gray-900"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      {Math.round(jobFit.score)}%
                    </motion.p>
                  </motion.div>
                </div>

                {/* AI Insight */}
                {jobFit.aiSummary && (
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-gray-700 shadow-sm">
                    <strong className="block text-blue-600 mb-1">
                      AI Insight
                    </strong>
                    <p className="leading-relaxed">{jobFit.aiSummary}</p>
                  </div>
                )}

                {/* Skills */}
                {renderSkillPills(
                  "Matched skills",
                  jobFit.matchedSkills ?? [],
                  "No overlapping skills detected yet."
                )}
                {renderSkillPills(
                  "Missing skills",
                  jobFit.missingSkills ?? [],
                  "Great news! You already cover all highlighted requirements."
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Ready to continue? You can apply right from here too.
                  </p>
                  <div className="flex gap-2 self-start sm:self-auto">
                    <Button
                      variant="outline"
                      className="text-sm hover:bg-slate-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFitExpanded(false);
                      }}
                    >
                      Hide details
                    </Button>
                    <ApplyButton />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const ApplyButton = () => {
    if (!canSeeApply || isRecruiterOrCompany) return null;
    if (isUnauthed) {
      return (
        <Button
          type="button"
          variant="outline"
          onClick={handleUnauthedApply}
          disabled={isRedirecting}
          className="text-black text-sm md:text-base font-medium border border-[#707070] px-4 py-2 rounded-lg"
        >
          {isRedirecting ? "Redirecting…" : "Apply"}
        </Button>
      );
    }
    return (
      <button
        type="button"
        onClick={handleCandidateApply}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            handleCandidateApply(e as unknown as MouseEvent);
          }
        }}
        disabled={resumeLoading || isRedirecting}
        className={clsx(
          "text-black text-sm md:text-base font-medium border border-[#707070] px-4 py-2 rounded-lg bg-transparent",
          (resumeLoading || isRedirecting) && "opacity-60 cursor-not-allowed"
        )}
      >
        <span className="sr-only">Apply to {job.title}</span>
        <span aria-hidden>
          {resumeLoading
            ? "Checking…"
            : isRedirecting
            ? "Redirecting…"
            : "Apply"}
        </span>
      </button>
    );
  };

  const EmploymentBadge = () => (
  <span className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg text-sm text-gray-700 capitalize">
    {job.employement_Type || "Not Specified"}
  </span>
);


  // ===== header with Apply on the right; on mobile, View details goes under Apply =====
  const HeaderRow = () => (
    <div className="flex items-start gap-3 sm:gap-4">
      <CompanyAvatar />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => router.push(detailsLink)}
            className="text-left"
          >
            <h3 className="font-semibold text-base sm:text-lg md:text-xl text-gray-900 hover:underline">
              {job.title}
            </h3>
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => navigateToPosterProfile(e)}
              onKeyDown={(e) => navigateToPosterProfile(e)}
              className="text-primary text-sm hover:underline cursor-pointer"
            >
              {postedByName}
            </span>
          </button>

          {/* Right controls: stack on mobile (Apply top, View details below), inline on sm+ */}
          <div className="flex flex-col sm:flex-row-reverse sm:items-center gap-2 shrink-0">

            <ApplyButton />
            <button
              type="button"
              onClick={() => router.push(detailsLink)}
              className="text-primary text-sm font-medium underline underline-offset-2 hover:opacity-90 text-right sm:text-left"
            >
              View details
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Body = () => (
    <>
      {/* Description */}
      <DescriptionClamp html={job.description} maxLines={4} className="mt-2" />

      {/* Profile fit bar + details */}
      <div className="space-y-2 mt-3">
        {renderFitBadge()}
        <div className="mt-2">{renderFitDetailsPanel()}</div>
      </div>

      {/* Chips row */}
      <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-gray-700 mt-3">
        <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg">
          <MapPin className="h-4 w-4 mr-1" aria-hidden />
          <span className="truncate">{job.location}</span>
        </div>
      {(() => {
  const salary = (job.salaryRange ?? "").trim();
  const shouldShow = salary !== "" && salary !== "00" && salary !== "0" && salary !== " 00";
  return (
    shouldShow && (
      <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg">
        <span className="truncate">{salary}</span>
      </div>
    )
  );
})()}

        <div className="flex items-center bg-[#E9ECFC] px-2.5 py-1.5 rounded-lg capitalize">
          {job.location_Type || "Onsite"}
        </div>
        <EmploymentBadge />
        <div>{renderApplicantBadge()}</div>
      </div>

      <div className="text-[#059c05] font-semibold mt-3">
        {formatDate(job.updatedAt)}
      </div>
    </>
  );

  if (variant === "suggested") {
    return (
      <Card
        className={clsx(
          "hover:shadow-md transition-shadow",
          "[&_*:focus-visible]:outline-none [&_*:focus-visible]:ring-2 [&_*:focus-visible]:ring-primary/60",
          className
        )}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:gap-4">
            <HeaderRow />
            <Body />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={clsx(
        "hover:shadow-md transition-shadow",
        "[&_*:focus-visible]:outline-none [&_*:focus-visible]:ring-2 [&_*:focus-visible]:ring-primary/60",
        className
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:gap-4">
          <HeaderRow />
          <Body />
        </div>
      </CardContent>
    </Card>
  );
}
