"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  MessageCircle,
  Menu,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Video,
  Settings,
  Bookmark,
  CreditCard,
  User,
  X,
} from "lucide-react";
import { ScrollingInfoBar } from "./scrolling-info-bar";
import { GlobalSearch } from "../global-search";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, Fragment, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCompanyAccount,
  getMyResume,
  getRecruiterAccount,
} from "@/lib/api-service";
import { useSocket } from "@/hooks/use-socket";

interface Notification {
  _id: string;
  message: string;
  createdAt?: string;
  isViewed: boolean;
  type?: string;
  to?: string;
  id?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Notification[];
}

export function SiteHeader() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userAvatar, setUserAvatar] = useState("");
  const [userName, setUserName] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [msg, setMsg] = useState(0);
  const [liveNotificationCount, setLiveNotificationCount] = useState<number | null>(null);
  const safeHeaderHeight = headerHeight || 64;
  const queryClient = useQueryClient();

  const userRole = session?.user?.role; // 'candidate', 'recruiter', 'company'
  const userId = session?.user?.id;
  const isValid = session?.user?.isValid === true ? true : false;

  const socket = useSocket();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!socket || !userId) return;

    // Join notification room
    socket.emit("joinNotification", userId);

    const handleNewNotification = (payload: any) => {
      const incoming =
        payload?.notification || payload?.n || payload?.notificationDoc || payload;

      if (!incoming?._id && !incoming?.id) return;
      const normalizedId = incoming._id || incoming.id;

      setLiveNotificationCount((prev) => {
        if (typeof payload?.count === "number") return payload.count;
        return typeof prev === "number" ? prev + (incoming?.isViewed ? 0 : 1) : prev;
      });

      queryClient.setQueryData<Notification[]>(["notifications", userId], (old = []) => {
        const exists = old.some((n) => n._id === normalizedId);
        if (exists) return old;
        const normalized: Notification = {
          _id: normalizedId,
          message: incoming.message ?? "",
          createdAt: incoming.createdAt,
          isViewed: Boolean(incoming.isViewed === true),
          type: incoming.type,
          to: incoming.to,
          id: incoming.id,
        };
        return [normalized, ...old];
      });
    };

    const handleCountUpdate = (payload: any) => {
      if (typeof payload?.count === "number") {
        setLiveNotificationCount(payload.count);
      }
    };

    const handleMsgCount = (data: any) => {
      setMsg(data);
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("notificationCountUpdated", handleCountUpdate);
    socket.on("msg_count", handleMsgCount);

    // Cleanup on unmount or dependency change
    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationCountUpdated", handleCountUpdate);
      socket.off("msg_count", handleMsgCount);
    };
  }, [socket, userId, queryClient]);


  const getUpgradePath = () => {
    switch (userRole) {
      case "recruiter":
        return "/recruiter-pricing";
      case "candidate":
        return "/user-pricing";
      case "company":
        return "/company-pricing";
      default:
        return null;
    }
  };

  // Fetch notifications using useQuery
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isError,
    error,
  } = useQuery<Notification[], Error>({
    queryKey: ["notifications", userId],
    queryFn: async (): Promise<Notification[]> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/notifications/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || "Failed to fetch notifications.");
      }
    },
    enabled: !!userId && status === "authenticated",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Calculate unread notifications count
  const unreadCount = notifications.filter(
    (notification) => !notification.isViewed
  ).length;
  const notificationCount = liveNotificationCount ?? unreadCount;

  // Resume query (only if role is candidate)
  const { data: myresume, isLoading: resumeLoading } = useQuery({
    queryKey: ["my-resume"],
    queryFn: getMyResume,
    select: (data) => data?.data,
    enabled: userRole === "candidate" && !!userId,
  });

  // Recruiter query (only if role is recruiter)
  const { data: recruiter, isLoading: recruiterLoading } = useQuery({
    queryKey: ["recruiter", userId],
    queryFn: () => getRecruiterAccount(userId || ""),
    select: (data) => data?.data,
    enabled: userRole === "recruiter" && !!userId,
  });

  // Company query (only if role is neither candidate nor recruiter)
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company-account", userId],
    queryFn: () => getCompanyAccount(userId || ""),
    select: (data) => data?.data,
    enabled: userRole !== "candidate" && userRole !== "recruiter" && !!userId,
  });

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "authenticated" && session?.accessToken) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
              },
            }
          );
          const result = await response.json();
          if (result.success) {
            setUserAvatar(result.data.avatar.url || "");
            setUserName(result.data.name || "U");
          } else {
            console.error("Failed to fetch user data:", result.message);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [status, session?.accessToken]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    updateHeight();

    const current = headerRef.current;
    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined" && current) {
      resizeObserver = new ResizeObserver(() => updateHeight());
      resizeObserver.observe(current);
    } else {
      window.addEventListener("resize", updateHeight);
    }

    return () => {
      if (resizeObserver && current) {
        resizeObserver.unobserve(current);
      } else {
        window.removeEventListener("resize", updateHeight);
      }
    };
  }, []);

  // Return an object with all relevant links for the user role
  const getDashboardLinks = () => {
    switch (userRole) {
      case "recruiter":
        return {
          dashboard: "/recruiter-dashboard",
          myPlan: "/my-plans",
          elevatorPitch: "/elevator-pitch",
          settings: "/account",
        };
      case "company":
        return {
          dashboard: "/elevator-video-pitch",
          myPlan: "/my-plans",
          settings: "/account",
        };
      case "candidate":
        return {
          dashboard: "/account",
          myPlan: null,
          elevatorPitch: null,
          settings: "/account",
        };
      default:
        return {
          dashboard: "/dashboard",
          myPlan: null,
          elevatorPitch: null,
          settings: null,
        };
    }
  };

  const getProfileLink = () => {
    return userRole === "candidate" ? "/account" : "/dashboard";
  };

  // Helper function to check if a link is active
  const isActive = (href: string) => {
    return pathname === href;
  };

  const desktopNavLinkBase =
    "relative inline-flex items-center gap-1 px-1 py-0.5 text-sm font-medium transition-all duration-200 focus:outline-none active:scale-[0.97]";
  const mobileNavLinkBase =
    "relative flex w-full items-center justify-between rounded-md px-2 py-2 text-base transition-all duration-200 focus:outline-none active:scale-[0.98]";
  const navLinkUnderlineClasses =
    "after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-[#2B7FD0] after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100";
  const navLinkActiveClasses = "text-[#2B7FD0] after:scale-x-100";
  const navLinkInactiveClasses =
    "text-slate-700 hover:text-[#2B7FD0] focus-visible:text-[#2B7FD0]";
  const getNavLinkClasses = (
    href: string,
    {
      variant = "desktop",
      extra = "",
    }: { variant?: "desktop" | "mobile"; extra?: string } = {}
  ) => {
    const base = variant === "desktop" ? desktopNavLinkBase : mobileNavLinkBase;
    const stateClass = isActive(href)
      ? navLinkActiveClasses
      : navLinkInactiveClasses;
    return `${base} ${navLinkUnderlineClasses} ${stateClass} ${extra}`.trim();
  };
  const getMobileNavLinkClasses = (href: string) => {
    const active = isActive(href);
    return `flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-blue-50 text-[#2B7FD0] shadow-sm"
        : "text-slate-700 hover:bg-slate-50 hover:text-[#2B7FD0]"
    }`;
  };
  const getMobileSubLinkClasses = (href: string) => {
    const active = isActive(href);
    return `flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-blue-50 text-[#2B7FD0]"
        : "text-slate-600 hover:bg-slate-50 hover:text-[#2B7FD0]"
    }`;
  };

  const links = getDashboardLinks();

  // Shared user dropdown content (used for desktop and mobile avatar)
  const UserMenuContent = () => (
    <DropdownMenuContent align="end">
      {(userRole === "recruiter" || userRole === "company") && (
        <Fragment>
          {links.dashboard && (
            <DropdownMenuItem asChild>
              <Link
                href={links.dashboard}
                className="flex items-center w-full px-2 py-1.5"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Link>
            </DropdownMenuItem>
          )}
          {links.settings && (
            <DropdownMenuItem asChild>
              <Link
                href={links.settings}
                className="flex items-center w-full px-2 py-1.5"
              >
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
          )}
          {!isValid && (
            <DropdownMenuItem asChild>
              <Link
                href={
                  userRole === "recruiter"
                    ? "/recruiter-pricing"
                    : "/company-pricing"
                }
                className="flex items-center w-full px-2 py-1.5"
              >
                <CreditCard className="mr-2 h-4 w-4" /> My Plan
              </Link>
            </DropdownMenuItem>
          )}
        </Fragment>
      )}
      {userRole === "candidate" && (
        <Fragment>
          <DropdownMenuItem asChild>
            <Link
              href={getProfileLink()}
              className="flex items-center w-full px-2 py-1.5"
            >
              <User className="mr-2 h-4 w-4" /> Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/bookmarks"
              className="flex items-center w-full px-2 py-1.5"
            >
              <Bookmark className="mr-2 h-4 w-4" /> Bookmarks
            </Link>
          </DropdownMenuItem>
          {!isValid && (
            <DropdownMenuItem asChild>
              <Link
                href="/user-pricing"
                className="flex items-center w-full px-2 py-1.5"
              >
                <CreditCard className="mr-2 h-4 w-4" /> My Plan
              </Link>
            </DropdownMenuItem>
          )}
        </Fragment>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() =>
          signOut({
            callbackUrl: "/",
          })
        }
        className="cursor-pointer"
      >
        <LogOut className="mr-2 h-4 w-4" /> Log Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (!mounted) {
    return <div style={{ height: 64 }} />;
  }

  return (
    <div className="w-full" suppressHydrationWarning>
      {/* Top Navbar */}
      <div
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          isScrolled
            ? "bg-white/95 border-slate-200/80 shadow-sm supports-[backdrop-filter]:backdrop-blur-lg"
            : "bg-white/80 border-transparent supports-[backdrop-filter]:backdrop-blur-md"
        }`}
      >
        <div className="container flex h-14 items-center justify-between px-4 md:px-6 transition-colors duration-200">
          {/* Left Section: Logo */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg"
            >
              <Image
                src={"/assets/evp-logo.jpg"}
                alt="Logo"
                width={500}
                height={500}
                className="h-[38px] lg:h-[48px] w-[100px] lg:w-[140px]"
              />
            </Link>
          </div>

          {/* Middle Section: Search Bar (visible on medium screens and up) */}
          <div className="hidden md:flex flex-1 justify-center max-w-lg mx-4">
            <GlobalSearch />
          </div>

          {/* Navigation Links (desktop) */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors focus:outline-none ${
                isActive("/") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
              }`}
            >
              Home
            </Link>
            <Link
              href="/alljobs"
              className={`transition-colors focus:outline-none ${
                isActive("/alljobs") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
              }`}
            >
              Jobs
            </Link>
            <Link
              href="/elevator-video-pitch"
              className={`transition-colors focus:outline-none ${
                isActive("/elevator-video-pitch")
                  ? "text-[#2B7FD0]"
                  : "hover:text-[#2B7FD0]"
              }`}
            >
              My EVP Profile
            </Link>
            {/* Upgrade Plan (desktop) */}
            {status === "authenticated" && (
              <Link
                href={getUpgradePath()!}
                className={`transition-colors focus:outline-none font-semibold ${
                  isActive(getUpgradePath()!)
                    ? "text-[#2B7FD0]"
                    : "text-[#2B7FD0] hover:opacity-80"
                }`}
              >
                Upgrade Plan
              </Link>
            )}
            <Link
              href="/blogs"
              className={`transition-colors focus:outline-none ${
                isActive("/blogs") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
              }`}
            >
              Blogs
            </Link>
            <Link
              href="/about-us"
              className={`transition-colors focus:outline-none ${
                isActive("/about-us")
                  ? "text-[#2B7FD0]"
                  : "hover:text-[#2B7FD0]"
              }`}
            >
              About Us
            </Link>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`h-auto p-0 text-sm font-medium transition-colors focus:outline-none ${
                    pathname.startsWith("/help")
                      ? "text-[#2B7FD0]"
                      : "hover:text-[#2B7FD0]"
                  }`}
                >
                  Help & Info <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/faq" className="w-full px-2 py-1.5 block">
                    FAQs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contact-us" className="w-full px-2 py-1.5 block">
                    Contact Us
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`h-auto p-0 text-sm font-medium transition-colors focus:outline-none ${
                    pathname.startsWith("/more")
                      ? "text-[#2B7FD0]"
                      : "hover:text-[#2B7FD0]"
                  }`}
                >
                  More <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link
                    href="/privacy-policy"
                    className="w-full px-2 py-1.5 block"
                  >
                    Privacy Policy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/terms-condition"
                    className="w-full px-2 py-1.5 block"
                  >
                    Terms and Conditions
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Section: Action Buttons & Avatar or Login */}
          <div className="flex items-center gap-2 md:gap-4 md:ml-7">
            {status === "authenticated" ? (
              <>
                {/* Notifications Button with Unread Count Badge (desktop only) */}
                {/* 🔔 Notifications */}
                <Link
                  href="/notifications"
                  className="hidden xl:block relative"
                >
                  <Button
                    size="icon"
                    className="rounded-full bg-blue-500 text-white hover:bg-primary transition-all duration-200"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                  </Button>

                  {/* Real-time unread notifications badge */}
                  {notificationCount > 0 ? (
                    <motion.span
                      key="notification-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-semibold"
                    >
                      {notificationCount}
                    </motion.span>
                  ) : notificationsLoading ? (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-gray-300 animate-pulse" />
                  ) : null}
                </Link>

                {/* 💬 Messages */}
                <Link href="/messages" className="hidden xl:block relative">
                  <Button
                    size="icon"
                    className="rounded-full bg-blue-500 text-white hover:bg-primary transition-all duration-200"
                    aria-label="Messages"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>

                  {/* Real-time unread messages badge */}
                  {msg > 0 && (
                    <motion.span
                      key="message-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-semibold"
                    >
                      {msg}
                    </motion.span>
                  )}
                </Link>

                {/* DESKTOP Avatar */}
                <div className="hidden xl:block">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="h-10 w-10 cursor-pointer">
                        <AvatarImage src={userAvatar} alt="User Avatar" />
                        <AvatarFallback className="font-semibold">
                          {(userName && userName[0]) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <UserMenuContent />
                  </DropdownMenu>
                </div>

                {/* MOBILE Avatar (to the LEFT of hamburger, outside the Sheet) */}
                <div className="xl:hidden">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="h-9 w-9 cursor-pointer">
                        <AvatarImage src={userAvatar} alt="User Avatar" />
                        <AvatarFallback className="font-semibold text-sm">
                          {(userName && userName[0]) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <UserMenuContent />
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <Link href="/login" className="hidden xl:block">
                <Button
                  className={`bg-blue-500 hover:bg-primary text-white ${
                    isActive("/login") ? "bg-[#2B7FD0]" : ""
                  }`}
                >
                  Login/Sign-Up
                </Button>
              </Link>
            )}

            {/* Mobile Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`xl:hidden h-10 w-10 rounded-full transition-all duration-300 active:scale-95 ${
                    sheetOpen
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "hover:bg-blue-50"
                  }`}
                  aria-label="Toggle navigation menu"
                  aria-expanded={sheetOpen}
                  aria-controls="mobile-navigation"
                >
                  {sheetOpen ? (
                    <X className="h-5 w-5 transition-transform duration-300 rotate-90" />
                  ) : (
                    <Menu className="h-6 w-6 transition-transform duration-300" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                id="mobile-navigation"
                side="left"
                className="w-[300px] p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="h-full flex flex-col overflow-hidden">
                  <Link
                    href="/"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-2 font-bold text-lg mb-6 px-4 pt-4"
                  >
                    <Image
                      src={"/assets/evp-logo.jpg"}
                      alt="Logo"
                      width={500}
                      height={500}
                      className="h-[38px] w-[100px]"
                    />
                  </Link>

                  {/* Mobile-only search */}
                  <div className="mb-6 md:hidden px-4">
                    <GlobalSearch onResultSelect={() => setSheetOpen(false)} />
                  </div>

                  {/* Scrollable content area */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24">
                    {status === "authenticated" && (
                      <div className="space-y-2 mb-6">
                        <Link
                          href="/notifications"
                          className="relative block"
                          onClick={() => setSheetOpen(false)}
                        >
                          <Button
                            size="sm"
                            className="w-full bg-blue-500 text-white hover:bg-primary my-5"
                          >
                            <Bell className="h-4 w-4 mr-2" />
                            Notifications
                            {notificationCount > 0 && !notificationsLoading && (
                              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-semibold">
                                {notificationCount}
                              </span>
                            )}
                            {notificationsLoading && (
                              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-300 animate-pulse"></span>
                            )}
                          </Button>
                        </Link>
                        <Link
                          href="/messages"
                          className="block"
                          onClick={() => setSheetOpen(false)}
                        >
                          <Button
                            size="sm"
                            className="w-full bg-blue-500 text-white hover:bg-primary mb-5"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Messages
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Mobile nav links */}
                    <nav className="grid gap-2 text-sm font-medium">
                      <Link
                        href="/"
                        onClick={() => setSheetOpen(false)}
                        className={getMobileNavLinkClasses("/")}
                      >
                        Home
                      </Link>
                      <Link
                        href="/alljobs"
                        onClick={() => setSheetOpen(false)}
                        className={getMobileNavLinkClasses("/alljobs")}
                      >
                        Jobs
                      </Link>
                      {(userRole === "candidate" ||
                        userRole === "recruiter" ||
                        userRole === "company") && (
                        <Link
                          href="/elevator-video-pitch"
                          onClick={() => setSheetOpen(false)}
                          className={getMobileNavLinkClasses(
                            "/elevator-video-pitch"
                          )}
                        >
                          My EVP Profile
                        </Link>
                      )}
                      <Link
                        href="/blogs"
                        onClick={() => setSheetOpen(false)}
                        className={getMobileNavLinkClasses("/blogs")}
                      >
                        Blogs
                      </Link>
                      {/* Upgrade Plan (mobile) */}
                      {status === "authenticated" && (
                          <Link
                            href={getUpgradePath()!}
                            onClick={() => setSheetOpen(false)}
                            className={getMobileNavLinkClasses(
                              getUpgradePath()!
                            )}
                          >
                            Upgrade Plan
                          </Link>
                        )}
                      <Link
                        href="/about-us"
                        onClick={() => setSheetOpen(false)}
                        className={getMobileNavLinkClasses("/about-us")}
                      >
                        About Us
                      </Link>
                      <div className="space-y-1.5">
                        <div className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Help & Info
                        </div>
                        <div className="space-y-1">
                          <Link
                            href="/faq"
                            onClick={() => setSheetOpen(false)}
                            className={getMobileSubLinkClasses("/faq")}
                          >
                            FAQs
                          </Link>
                          <Link
                            href="/contact-us"
                            onClick={() => setSheetOpen(false)}
                            className={getMobileSubLinkClasses("/contact-us")}
                          >
                            Contact Us
                          </Link>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          More
                        </div>
                        <div className="space-y-1">
                          <Link
                            href="/privacy-policy"
                            onClick={() => setSheetOpen(false)}
                            className={getMobileSubLinkClasses(
                              "/privacy-policy"
                            )}
                          >
                            Privacy Policy
                          </Link>
                          <Link
                            href="/terms-condition"
                            onClick={() => setSheetOpen(false)}
                            className={getMobileSubLinkClasses(
                              "/terms-condition"
                            )}
                          >
                            Terms and Conditions
                          </Link>
                        </div>
                      </div>
                      {status === "authenticated" ? (
                        <Button
                          onClick={() => {
                            setSheetOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          variant="outline"
                          className="w-full mt-4"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      ) : (
                        <Link href="/login" onClick={() => setSheetOpen(false)}>
                          <Button className="w-full bg-blue-500 hover:bg-primary text-white mt-4">
                            Login/Sign-Up
                          </Button>
                        </Link>
                      )}
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <motion.div
        className="transition-[margin-top] duration-300 ease-out"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginTop: safeHeaderHeight }}
      >
        <ScrollingInfoBar />
      </motion.div>
    </div>
  );
}
