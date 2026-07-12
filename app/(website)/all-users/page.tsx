"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import {
  Search,
  User,
  Building2,
  UserCheck,
  MapPin,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface SearchUser {
  _id: string;
  name: string;
  role: "candidate" | "recruiter" | "company" | "admin" | "super-admin";
  phoneNum: string | null;
  address: string | null;
  position?: string | null;
  slug: string;
  avatar?: {
    url?: string | null;
  } | null;
  immediatelyAvailable?: boolean | null;
}

interface SearchResult {
  success: boolean;
  message: string;
  data: Array<SearchUser | null | undefined>;
}

const PAGE_SIZE = 12;

function AllUsersContent() {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SearchUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [onlyImmediate, setOnlyImmediate] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initial params
  useEffect(() => {
    const s = searchParams.get("s") ?? "";
    const role = searchParams.get("role") ?? "all";
    const p = Number(searchParams.get("page") ?? "1");
    const immediate = searchParams.get("immediate") === "1";
    setSearchQuery(s);
    setSelectedRole(
      ["candidate", "recruiter", "company"].includes(role) ? role : "all"
    );
    setPage(Number.isFinite(p) && p >= 1 ? p : 1);
    setOnlyImmediate(immediate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all users
  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters
  useEffect(() => {
    filterUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchQuery, selectedRole, onlyImmediate]);

  // Sync URL params
  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("s", searchQuery.trim());
      if (selectedRole !== "all") params.set("role", selectedRole);
      params.set("page", String(page));
      if (onlyImmediate) params.set("immediate", "1");
      router.replace(`${pathname}?${params.toString()}`);
    }, 200);
    return () => clearTimeout(id);
  }, [searchQuery, selectedRole, page, onlyImmediate, router, pathname]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedRole, onlyImmediate]);

  // Fetch and clean user data
  const fetchAllUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/fetch/all/users`,
        { cache: "no-store" }
      );
      const result: SearchResult = await response.json();

      if (result?.success && Array.isArray(result?.data)) {
        const safe = result.data
          .filter(
            (u): u is SearchUser => !!u && typeof u === "object" && !!u._id
          )
          .map((u) => ({
            ...u,
            name: u.name ?? "Unknown",
            phoneNum: u.phoneNum ?? null,
            address: u.address ?? null,
            avatar: u.avatar ?? null,
            immediatelyAvailable:
              typeof u.immediatelyAvailable === "boolean"
                ? u.immediatelyAvailable
                : null,
          }))
          // 🚫 Exclude admin/super-admin users right after fetch
          .filter(
            (u) => u.role !== "admin" && u.role !== "super-admin"
          );

        setUsers(safe);
        setFilteredUsers(safe);
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users
  const filterUsers = () => {
    let filtered = users.slice();

    // 🚫 Always exclude admin/super-admin just in case
    filtered = filtered.filter(
      (u) => u.role !== "admin" && u.role !== "super-admin"
    );

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((user) => {
        const name = user?.name?.toLowerCase() ?? "";
        const role = user?.role?.toLowerCase() ?? "";
        const address = user?.address?.toLowerCase() ?? "";
        const position = user?.position?.toLowerCase() ?? "";
        return (
          name.includes(q) ||
          address.includes(q) ||
          position.includes(q) ||
          role.includes(q)
        );
      });
    } else {
      filtered = [];
    }

    // Filter by role
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user?.role === selectedRole);
    }

    // Immediate-only toggle
    if (onlyImmediate) {
      filtered = filtered.filter(
        (u) => u.role === "candidate" && u.immediatelyAvailable === true
      );
    }

    // Sort: immediately available candidates first
    filtered.sort((a, b) => {
      const aAvail = a.immediatelyAvailable === true ? 1 : 0;
      const bAvail = b.immediatelyAvailable === true ? 1 : 0;
      return bAvail - aAvail;
    });

    setFilteredUsers(filtered);
  };

  // Handle click
  const handleUserClick = (user?: SearchUser) => {
    if (!user) return;
    const role = user.role ?? "candidate";
    const id = user.slug;
    const profileUrl =
      role === "company"
        ? `/cmp/${id}`
        : role === "recruiter"
        ? `/rp/${id}`
        : `/cp/${id}`;
    router.push(profileUrl);
  };

  // Role icon
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "candidate":
        return <User className="h-5 w-5 text-green-600" />;
      case "recruiter":
        return <UserCheck className="h-5 w-5 text-blue-600" />;
      case "company":
        return <Building2 className="h-5 w-5 text-purple-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredUsers.slice(start, end).filter(Boolean);
  }, [filteredUsers, page]);

  const totalResults = filteredUsers.length;
  const immediateCount = filteredUsers.filter(
    (u) => u.role === "candidate" && u.immediatelyAvailable === true
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Search Results
              </h1>
              <p className="text-gray-600 mt-1">
                {isLoading
                  ? "Loading..."
                  : searchQuery.trim()
                  ? `${totalResults} user${
                      totalResults === 1 ? "" : "s"
                    } found · ${immediateCount} immediate`
                  : "Type to search users"}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64 text-[16px] leading-5"
                  aria-label="Search users"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4B98DE] focus:border-transparent"
                  aria-label="Filter by role"
                >
                  <option value="all">All Roles</option>
                  <option value="candidate">Candidates</option>
                  <option value="recruiter">Recruiters</option>
                  <option value="company">Companies</option>
                </select>

                {/* Immediate toggle */}
                <button
                  type="button"
                  onClick={() => setOnlyImmediate((v) => !v)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border ${
                    onlyImmediate
                      ? "bg-green-50 border-green-300 text-green-800"
                      : "bg-white border-gray-200 text-gray-700"
                  } focus:outline-none`}
                  aria-pressed={onlyImmediate}
                >
                  {onlyImmediate ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Immediate only
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      Immediate (off)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchQuery.trim() && filteredUsers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedUsers.map((user) => (
                <Card
                  key={user._id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-[#4B98DE] hover:border-l-[#3a7bc8]"
                  onClick={() => handleUserClick(user)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={
                            user?.avatar?.url ||
                            "/placeholder.svg?height=48&width=48"
                          }
                          alt={user?.name ?? "User"}
                        />
                        <AvatarFallback className="bg-[#4B98DE] text-white font-semibold">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {user?.name ?? "Unknown"}
                          </h3>

                          {user.role === "candidate" &&
                            user.immediatelyAvailable === true && (
                              <span className="ml-2 inline-flex items-center gap-2 text-xs font-medium rounded-full px-2 py-0.5 bg-green-50 text-green-800">
                                <span className="h-2 w-2 rounded-full bg-green-600 inline-block" />
                                Immediate
                              </span>
                            )}

                          {getRoleIcon(user?.role)}
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {user?.address ?? "No address available."}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[#4B98DE] border-[#4B98DE] hover:bg-[#4B98DE] hover:text-white transition-colors bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(user);
                        }}
                      >
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700 px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery.trim()
                ? "No users match your search"
                : "Type to search users"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery.trim()
                ? "Try adjusting your search or filter criteria"
                : "Start typing in the search box to see results"}
            </p>

            {(searchQuery || selectedRole !== "all" || onlyImmediate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRole("all");
                  setOnlyImmediate(false);
                }}
                className=" border-[#4B98DE] bg-[#4B98DE] text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AllUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-gray-600">Loading search params…</p>
          </div>
        </div>
      }
    >
      <AllUsersContent />
    </Suspense>
  );
}
