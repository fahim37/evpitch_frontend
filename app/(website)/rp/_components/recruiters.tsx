"use client";

import type React from "react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";
import {
  Globe,
  Linkedin,
  Twitter,
  LinkIcon,
  MapPin,
  XCircle, // 🆕 for deactivated UI icon
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // 🆕 for deactivated UI card
import { VideoPlayer } from "@/components/company/video-player";
import CandidateSharePopover from "../../cp/_components/candidateShare";
import SocialLinks from "../../elevator-video-pitch/_components/SocialLinks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; // sonner toast

interface SocialLink {
  label: string;
  _id: string;
  url?: string;
}

interface RecruiterCompany {
  _id: string;
  cname: string;
  userId: string;
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

interface RecruiterData {
  _id: string;
  userId: string; // recruiter user id
  bio: string;
  photo?: string;
  banner?: string;
  title: string;
  firstName: string;
  lastName: string;
  sureName: string;
  country: string;
  city: string;
  zipCode: string;
  emailAddress: string;
  phoneNumber: string;
  sLink: SocialLink[];
  createdAt: string;
  elevatorPitch: PitchData;
  updatedAt: string;
  __v: number;
  companyId: RecruiterCompany; // company object with _id
  deactivate?: boolean; // 🆕 matches your API payload
}

interface ApiListResponse<T> {
  success: boolean;
  total?: number;
  data: T[];
  message?: string;
}

interface ApiObjectResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface FollowCountResponse {
  count: number;
  isFollowing?: boolean;
}

interface MydataProps {
  userId: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

// --- shared fetch helper ---
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Response shape for /user/single
interface SingleUserFollowingItem {
  email: string;
  name: string;
  _id: string;
}
interface SingleUserResponse {
  data?: { following?: Array<SingleUserFollowingItem | null> };
}

// ---------- Deactivated UI ----------
const DeactivatedProfile: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-4">
    <Card className="max-w-md w-full text-center shadow-md border border-dashed border-gray-200">
      <CardContent className="py-10 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-2xl font-semibold">Profile is not available</h1>
        <p className="text-gray-500 text-sm max-w-sm">
          This recruiter profile has been deactivated. Please go back to the
          home page to continue browsing.
        </p>
        <Button asChild className="mt-2">
          <a href="/">Go to Home</a>
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default function Recruiters({ userId }: MydataProps) {
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const myId = session?.user?.id as string | undefined;

  const queryClient = useQueryClient();

  // ---- single user (source of truth for "already following") ----
  const { data: singleUser } = useQuery<SingleUserResponse, Error>({
    queryKey: ["single-user"],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/user/single`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    enabled: !!token,
    retry: 1,
  });

  // Recruiter profile
  const {
    data: recruiterData,
    isLoading: recruiterLoading,
    isError: recruiterIsError,
    error: recruiterError,
  } = useQuery({
    queryKey: ["recruiter", userId],
    queryFn: async () => {
      const json = await fetchJSON<ApiObjectResponse<RecruiterData>>(
        `${BASE_URL}/recruiter/recruiter-account/slug/${userId}`
      );
      return json.data;
    },
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (status === "authenticated" && myId === userId) {
      queryClient.invalidateQueries({ queryKey: ["recruiter", userId] });
    }
  }, [status, myId, userId, queryClient]);

  // Safe IDs
  const recruiterId = recruiterData?.userId; // the person being followed
  const companyId = recruiterData?.companyId?.userId; // use company userId

  // Follow count + (optional) follow status (for count/backup)
  const { data: followInfo, isLoading: followInfoLoading } = useQuery({
    queryKey: ["follow", "count", recruiterId],
    queryFn: async () => {
      const raw = await fetchJSON<any>(
        `${BASE_URL}/following/count?recruiterId=${recruiterId}`
      );
      const parsed: FollowCountResponse =
        raw?.data && typeof raw.data === "object"
          ? {
              count:
                typeof raw.data.count === "number"
                  ? raw.data.count
                  : typeof raw.count === "number"
                  ? raw.count
                  : typeof raw.data === "number"
                  ? raw.data
                  : 0,
              isFollowing:
                typeof raw.data.isFollowing === "boolean"
                  ? raw.data.isFollowing
                  : typeof raw.isFollowing === "boolean"
                  ? raw.isFollowing
                  : undefined,
            }
          : { count: 0, isFollowing: undefined };
      return { count: parsed.count ?? 0, isFollowing: parsed.isFollowing };
    },
    enabled: Boolean(recruiterId),
    staleTime: 15_000,
  });

  // Determine following from singleUser list
  const followingIds = useMemo(
    () =>
      singleUser?.data?.following
        ?.filter(Boolean)
        .map((u) => (u as SingleUserFollowingItem)._id) ?? [],
    [singleUser?.data?.following]
  );
  const isFollowing = recruiterId ? followingIds.includes(recruiterId) : false;

  const canFollow = useMemo(() => {
    if (!myId || !recruiterData?.userId) return false;
    return myId !== recruiterData.userId;
  }, [myId, recruiterData?.userId]);

  // ---- Mutation (toggle follow) with optimistic update + toasts ----
  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (!myId) {
        throw new Error("Please login to follow this recruiter.");
      }
      const nextIsFollowing = !isFollowing; // true => /follow, false => /unfollow
      const url = `${BASE_URL}/following/${
        nextIsFollowing ? "follow" : "unfollow"
      }`;
      const method = nextIsFollowing ? "POST" : "DELETE";
      const payload = { userId: myId, recruiterId, companyId };
      return fetchJSON<any>(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["follow", "count", recruiterId],
      });
      const prevCount = queryClient.getQueryData<{
        count: number;
        isFollowing?: boolean;
      }>(["follow", "count", recruiterId]);
      const optimisticNext = !isFollowing;
      const nextCount = (prevCount?.count ?? 0) + (optimisticNext ? 1 : -1);
      queryClient.setQueryData(["follow", "count", recruiterId], {
        count: Math.max(0, nextCount),
        isFollowing: optimisticNext,
      });
      return { prevCount, wasFollowing: isFollowing } as const;
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prevCount) {
        queryClient.setQueryData(
          ["follow", "count", recruiterId],
          ctx.prevCount
        );
      }
      const msg =
        typeof err?.message === "string" ? err.message : "Follow action failed";
      if (/Already following/i.test(msg)) {
        queryClient.invalidateQueries({ queryKey: ["single-user"] });
        queryClient.invalidateQueries({
          queryKey: ["follow", "count", recruiterId],
        });
        toast.info("You're already following this recruiter.");
        return;
      }
      if (/Not following/i.test(msg) || /already unfollowed/i.test(msg)) {
        queryClient.invalidateQueries({ queryKey: ["single-user"] });
        queryClient.invalidateQueries({
          queryKey: ["follow", "count", recruiterId],
        });
        toast.info("You were not following this recruiter.");
        return;
      }
      toast.error(msg || "Something went wrong");
    },
    onSuccess: (_data, _vars, ctx) => {
      if (ctx?.wasFollowing) {
        toast.success("You've unfollowed this recruiter.");
      } else {
        toast.success("You're now following this recruiter.");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["single-user"] });
      queryClient.invalidateQueries({
        queryKey: ["follow", "count", recruiterId],
      });
    },
  });

  // ---- Render states ----
  if (recruiterLoading) {
    return (
      <div className="container mx-auto p-6 animate-pulse">
        <div className="w-full h-48 bg-gray-200 rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mt-6">
          <div className="col-span-4 space-y-4">
            <div className="w-[170px] h-[170px] bg-gray-200 rounded-md"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="col-span-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (recruiterIsError) {
    return (
      <div className="container mx-auto p-6 text-red-500">
        Error: {(recruiterError as Error)?.message ?? "Failed to load profile"}
      </div>
    );
  }

  if (!recruiterData) {
    return (
      <div className="container mx-auto p-6">No recruiter data found.</div>
    );
  }

  // 🆕 If deactivated, show the “profile not available” view instead of the profile
  if (recruiterData.deactivate) {
    return <DeactivatedProfile />;
  }

  const iconMap: Record<string, React.ElementType> = {
    website: Globe,
    linkedin: Linkedin,
    twitter: Twitter,
    other: LinkIcon,
    upwork: LinkIcon,
  };

  const followersCount = followInfo?.count ?? 0;
  const followBusy = toggleFollowMutation.isPending;

  const disabled =
    !canFollow ||
    followBusy ||
    followInfoLoading ||
    !recruiterId ||
    !companyId ||
    !myId;

  return (
    <div className="lg:container lg:mx-auto lg:px-6 pb-8 md:pb-16">
      {/* Banner */}
      <div className="w-full h-auto">
        {recruiterData.banner ? (
          <Image
            src={recruiterData.banner}
            alt={`${recruiterData.firstName} banner`}
            width={1200}
            height={200}
            className="w-full h-auto object-cover lg:object-cover object-center"
          />
        ) : (
          <div className="w-full h-[150px] md:h-[300px] lg:h-[400px]  bg-gray-200" />
        )}
      </div>

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mt-[-10px] md:mt-[-20px] lg:mt[-30px] md:px-6">
          {/* Profile Section */}
          <div className="col-span-1 md:col-span-4 space-y-4">
            <div className="relative w-[120px] h-[120px] md:h-[170px] md:w-[170px] bg-gray-200 ring-2 ring-background shadow-md overflow-hidden bg-muted rounded-md">
              {recruiterData.photo ? (
                <Image
                  src={recruiterData.photo}
                  alt={`${recruiterData.firstName} ${recruiterData.lastName}`}
                  fill
                  className="rounded-md object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-500">No Photo</span>
                </div>
              )}
            </div>
            <div>
              <div className="py-2">
                <h1 className="text-2xl font-bold">
                  {recruiterData.firstName} {recruiterData.sureName}{" "}
                  {recruiterData.lastName}
                </h1>
                <p className="text-lg text-gray-600">{recruiterData.title}</p>
                {recruiterData.country && recruiterData.city && (
                  <p className="text-gray-700 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {recruiterData.country}, {recruiterData.city}
                  </p>
                )}
              </div>
              <div className="flex space-x-2 mt-2">
                <div>
                  <SocialLinks sLink={recruiterData.sLink} />
                </div>
              </div>
            </div>

            {/* Follow / Unfollow with count */}
            {myId !== userId && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => toggleFollowMutation.mutate()}
                  className={`${
                    isFollowing
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : "bg-blue-600 hover:bg-blue-700"
                  } transition-colors`}
                  aria-label={isFollowing ? "Unfollow" : "Follow"}
                  title={!myId ? "Sign in to follow" : undefined}
                  disabled={disabled}
                >
                  {followBusy
                    ? "Please wait…"
                    : isFollowing
                    ? "Unfollow"
                    : "Follow"}
                </Button>

                {(followInfo?.count ?? 0) > 0 && (
                  <span className="text-sm text-gray-600">
                    {followersCount} follower{followersCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* About */}
          <div className="col-span-1 md:col-span-6 pt-4 md:pt-24">
            <div className="flex items-center justify-between border-b-2 pb-2">
              <h3 className="font-semibold text-gray-800 mb-3 text-2xl">
                About me
              </h3>
              {userId ? (
                <CandidateSharePopover
                  userId={userId}
                  role="rp"
                  title={`${recruiterData.firstName} ${
                    recruiterData.lastName
                  } — ${recruiterData.title ?? "Candidate"}`}
                  summary={
                    recruiterData.bio
                      ? recruiterData.bio.replace(/<[^>]*>/g, "").slice(0, 180)
                      : ""
                  }
                />
              ) : null}
            </div>

            <div>
              <p
                className="text-gray-600 leading-relaxed list-item list-none"
                dangerouslySetInnerHTML={{
                  __html: recruiterData.bio || "No description provided",
                }}
              />
            </div>
          </div>
        </div>

        {/* Elevator Pitch */}
        {recruiterData?.elevatorPitch && (
          <div className="lg:py-12 pb-5 mt-6">
            <h2 className="text-xl lg:text-4xl font-bold mb-4 md:mb-24">
              Elevator Video Pitch©
            </h2>
            <div className="rounded-lg">
              <VideoPlayer
                pitchId={recruiterData?.elevatorPitch._id}
                className="w-full mx-auto"
              />
            </div>
          </div>
        )}

        <div className="border-t border-gray-300 mt-6" />
      </div>
    </div>
  );
}
