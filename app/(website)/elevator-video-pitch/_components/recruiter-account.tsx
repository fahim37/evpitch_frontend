"use client";

import type React from "react";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExternalLink,
  Globe,
  Linkedin,
  MapPin,
  BriefcaseBusiness,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type MaybeStringifiedArray = string[] | string | undefined;

type Company = {
  _id: string;
  userId: string;
  aboutUs?: string;
  avatar?: {
    url: string;
  };
  name?: string;
  country?: string;
  city?: string;
  zipcode?: string;
  cemail?: string;
  cPhoneNumber?: string;
  links?: MaybeStringifiedArray;
  industry?: string;
  service?: MaybeStringifiedArray;
  employeesId?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

type SLinkItem = {
  label: string;
  url: string;
};

export type Recruiter = {
  _id: string;
  userId: string;
  bio?: string;
  photo?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  sureName?: string;
  country?: string;
  city?: string;
  zipCode?: string;
  location?: string;
  emailAddress?: string;
  phoneNumber?: string;
  upworkUrl?: string;
  linkedIn?: string;
  xLink?: string;
  OtherLink?: string;
  roleAtCompany?: string;
  awardTitle?: string;
  programName?: string;
  programDate?: string;
  awardDescription?: string;
  companyId?: Company;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  sLink?: SLinkItem[];
  followerCount?: number;
};

function parseMaybeStringifiedArray(input: MaybeStringifiedArray): string[] {
  if (Array.isArray(input)) {
    if (
      input.length === 1 &&
      typeof input[0] === "string" &&
      input[0].trim().startsWith("[")
    ) {
      try {
        return JSON.parse(input[0]) as string[];
      } catch {
        return input as string[];
      }
    }
    return input as string[];
  }
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as string[];
    } catch {
      return [input];
    }
  }
  return [];
}

function getInitials(first?: string, last?: string) {
  const f = first?.[0] ?? "";
  const l = last?.[0] ?? "";
  const initials = `${f}${l}`.toUpperCase();
  return initials || "RC"; // Recruiter
}

function formatFollowerCount(n?: number) {
  if (!n && n !== 0) return null;
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
}

type Social = {
  label: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

function SocialIconLink({ href, label, icon: Icon }: Social) {
  if (!href) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition"
          )}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function RecruiterAccount({
  recruiter,
}: {
  recruiter: Recruiter;
}) {
  const followersText = useMemo(() => {
    const formatted = formatFollowerCount(recruiter?.followerCount);
    return formatted ? `${formatted} followers` : null;
  }, [recruiter?.followerCount]);

  if (!recruiter) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <p className="text-muted-foreground">{"No recruiter data found."}</p>
      </div>
    );
  }

  const {
    firstName,
    lastName,
    title,
    photo,
    bio,
    country,
    city,
    location,
    linkedIn,
    xLink,
    upworkUrl,
    OtherLink,
    roleAtCompany,
    followerCount,
    companyId,
  } = recruiter;

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || "Recruiter";
  const primaryLocation =
    location || [city, country].filter(Boolean).join(", ");

  const companyLinks = parseMaybeStringifiedArray(companyId?.links);
  const services = parseMaybeStringifiedArray(companyId?.service);

  const websiteHref = companyLinks[0] || OtherLink || upworkUrl || undefined;

  const taglineParts = [title, roleAtCompany].filter(Boolean);

  const socials: Social[] = [
    { label: "LinkedIn", href: linkedIn, icon: Linkedin },
    { label: "X (Twitter)", href: xLink, icon: Twitter },
    { label: "Upwork", href: upworkUrl, icon: BriefcaseBusiness },
    { label: "Website / Other", href: OtherLink, icon: ExternalLink },
  ];

  return (
    <div className="w-full bg-background">
      {/* Cover */}
      <div className="w-full">
        <div className="relative h-36 sm:h-44 md:h-56 lg:h-80 bg-muted">
          <Image
            src={
              "/placeholder.svg?height=256&width=1600&query=recruiter%20profile%20cover%20subtle%20gray"
            }
            alt={"Cover image"}
            fill
            className="object-cover opacity-80"
            priority
            sizes="100vw"
          />
        </div>
      </div>

      {/* Content */}
      <div className="border-b-2">
        <div className="mx-auto max-w-7xl lg:pb-10 pb-6">
          {/* Avatar row */}
          <div className="relative -mt-10 sm:-mt-14 md:-mt-16">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-40 md:w-40 rounded-lg ring-2 ring-background shadow-md overflow-hidden bg-muted">
                {/* shadcn/ui Avatar with fallback [^1] */}
                <Avatar className="h-full w-full rounded-lg">
                  <AvatarImage
                    src={photo || "/placeholder.svg"}
                    alt={`${fullName} photo`}
                  />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(firstName, lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="mt-6 grid gap-8 md:grid-cols-[1fr_300px]">
            {/* Left: profile summary */}
            <div className="space-y-1">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {fullName}
                </h1>
                {taglineParts.length > 0 && (
                  <p className="text-sm sm:text-base">
                    {taglineParts.map((part, idx) => (
                      <span key={idx}>
                        {part}
                        {idx < taglineParts.length - 1 && (
                          <span className="px-2">{"|"}</span>
                        )}
                      </span>
                    ))}
                  </p>
                )}
                {(country || city) && (
                  <p className="text-base text-muted-foreground">
                    {country || city}
                  </p>
                )}
              </div>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {companyId?.aboutUs ||
                  bio ||
                  "We connect top talent with great companies. Our mission is to make hiring simple, fast, and effective for everyone."}
              </p>

              {followersText && (
                <p className="text-sm text-muted-foreground">{followersText}</p>
              )}

              <TooltipProvider delayDuration={100}>
                <div className="flex flex-wrap items-center gap-2">
                  {socials.map((s) => (
                    <SocialIconLink
                      key={s.label}
                      href={s.href}
                      label={s.label}
                      icon={s.icon}
                    />
                  ))}
                </div>
              </TooltipProvider>

              <div className="flex gap-3 items-center">
                {Array.isArray(recruiter?.sLink) &&
                  recruiter.sLink.map((item, index) => {
                    if (
                      typeof item === "object" &&
                      item !== null &&
                      "label" in item &&
                      "url" in item
                    ) {
                      return (
                        <Link
                          key={index}
                          href={item.url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline capitalize"
                        >
                          {item.label}
                        </Link>
                      );
                    }
                    return null;
                  })}
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  {"All job posts free until January 2027"}
                </p>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#2B7FD0] hover:bg-[#2B7FD0]"
                >
                  Post A Job
                </Button>
              </div>
            </div>

            {/* Right: meta sidebar */}
            <aside className="space-y-8 md:pl-4">
              <div className="space-y-3">
                {companyId?.name && (
                  <div className="flex items-center gap-6">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted">
                      <Avatar>
                        <AvatarImage
                          src={companyId?.avatar?.url || "/placeholder.svg"}
                          alt={companyId?.name || ""}
                          className="rounded-none object-cover"
                        />
                        <AvatarFallback className="rounded-none">
                          {companyId?.name
                            ?.split(" ")
                            .map((word: string) => word[0]?.toUpperCase())
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {companyId.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-5">
                {websiteHref && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-6 w-6 text-muted-foreground" />
                    <Link
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline underline-offset-4"
                    >
                      {"Website"}
                    </Link>
                  </div>
                )}
                {primaryLocation && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm">
                      {"Location: "}
                      {primaryLocation}
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
