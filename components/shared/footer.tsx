"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function Footer() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const role = session?.user?.role;
  const router = useRouter();

  const handleCreateAccountClick = () => {
    if (!token) {
      router.push("/login");
    } else {
      router.push("/elevator-video-pitch");
    }
  };

  const handleCreateRecruiterAccountClick = () => {
    if (!token) {
      router.push("/login");
    } else if (role !== "recruiter") {
      router.push("/login"); // Redirect to login if user is not a company
    } else {
      router.push("/elevator-video-pitch");
    }
  };

  const handleCreateCompanyAccountClick = () => {
    if (!token) {
      router.push("/login");
    } else if (role !== "company") {
      router.push("/login"); // Redirect to login if user is not a company
    } else {
      router.push("/ elevator-video-pitch");
    }
  };

  const handleRecruiterPostJobClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    if (!token) {
      router.push("/login");
    } else if (role !== "recruiter") {
      router.push("/login"); // Redirect to login if user is not a recruiter
    } else {
      router.push("/add-job");
    }
  };

  const handleCompanyPostJobClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    if (!token) {
      router.push("/login");
    } else if (role !== "company") {
      router.push("/login"); // Redirect to login if user is not a company
    } else if (role == "company") {
      router.push("/add-job"); // Redirect to login if user is not a company
    } else {
      router.push("/elelevator-video-pitch");
    }
  };

  return (
    <footer className="bg-primary text-white py-12 md:py-16 lg:py-20">
      <div className="container px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Company Info */}
        <div className="flex flex-col gap-4">
          <Link href="#" className="flex items-center gap-2 font-bold text-lg">
            <Image
              src={"/assets/footer-logo.jpg"}
              alt="Logo"
              width={500}
              height={500}
              className="h-[60px] w-[180px] rounded-md"
            />
          </Link>
          <p className="text-sm text-white/80">
            Connecting talent with opportunities and businesses with clients,
            with one pitch!
          </p>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <MapPin className="h-4 w-4" />
            <span>124 City Road, London EC1V 2NX</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Mail className="h-4 w-4" />
            <span>clientsupport@evpitch.com</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Phone className="h-4 w-4" />
            <span>+44 0203 954 2530</span>
          </div>
        </div>

        {/* Column 2: For Candidates */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">For Candidates</h3>
          <Button
            onClick={handleCreateAccountClick}
            variant="secondary"
            className="bg-white text-v0-blue-500 hover:bg-gray-100 w-fit"
          >
            Elevator Video Pitch©
          </Button>
          <nav className="grid gap-2 text-sm">
            <Link href="/alljobs" className="text-white/80 hover:underline">
              Browse Jobs
            </Link>

            {/* <Link href="/alljobs" className="text-white/80 hover:underline">
              Apply for Jobs
            </Link> */}
            {/* <Link
              href="/bookmarks" // Required by Next.js type definitions
              onClick={(e) => {
                e.preventDefault(); // stop default Link navigation
                if (!token) {
                  router.push("/login");
                } else {
                  router.push("/bookmarks");
                }
              }}
              className="text-white/80 hover:underline"
            >
              Saved Jobs
            </Link> */}
          </nav>
        </div>

        {/* Column 3: For Recruiters */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">For Recruiters</h3>
          <Button
            onClick={handleCreateRecruiterAccountClick}
            variant="secondary"
            className="bg-white text-v0-blue-500 hover:bg-gray-100 w-fit"
          >
            Elevator Video Pitch©
          </Button>
          <nav className="grid gap-2 text-sm">
            <Link
              href="/add-job"
              onClick={handleRecruiterPostJobClick}
              className="text-white/80 hover:underline"
            >
              Post a Job
            </Link>
          </nav>
        </div>

        {/* Column 4: For Companies */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">For Companies</h3>
          <Button
            onClick={handleCreateCompanyAccountClick}
            variant="secondary"
            className="bg-white text-v0-blue-500 hover:bg-gray-100 w-fit"
          >
            Elevator Video Pitch©
          </Button>
          <nav className="grid gap-2 text-sm">
            <Link
              href="/add-job"
              onClick={handleCompanyPostJobClick}
              className="text-white/80 hover:underline"
            >
              Post a Job
            </Link>
          </nav>
        </div>
      </div>
      <div className="container px-4 md:px-6 mt-12 pt-8 border-t border-white/20 text-center text-sm text-white/60">
        <p className="mb-2">
          Elevator Video Pitch© Ltd. is registered in England in the United
          Kingdom at Companies House. Company Number 15978879
        </p>
        <p>&copy; 2026 Elevator Video Pitch©. All rights reserved.</p>
      </div>
    </footer>
  );
}
