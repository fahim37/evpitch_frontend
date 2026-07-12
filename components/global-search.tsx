"use client";
import { useState, useEffect, useRef } from "react";
import { Search, User, Building2, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Role = "candidate" | "recruiter" | "company";

interface SearchUser {
  _id?: string;
  name?: string;
  role?: Role | string;
  phoneNum?: string;
  address?: string;
  slug?: string;
  avatar?: {
    url?: string;
  };
  position?: string;
  // new property from API
  immediatelyAvailable?: boolean | null;
}

interface SearchResult {
  success?: boolean;
  message?: string;
  data?: (SearchUser | null)[];
}

interface GlobalSearchProps {
  onResultSelect?: () => void;
}

const safeLower = (v: unknown) =>
  typeof v === "string" ? v.toLowerCase() : "";

export function GlobalSearch({ onResultSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    const doSearch = async () => {
      const q = query.trim();
      if (!q) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      // open dropdown immediately while we search
      setIsOpen(true);
      await searchUsers(q);
    };

    const id = setTimeout(doSearch, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchUsers = async (searchQuery: string) => {
    // cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL;
      if (!base) {
        console.error("Missing NEXT_PUBLIC_BASE_URL");
        setResults([]);
        // keep dropdown open so "no results" can be shown if desired
        setIsOpen(true);
        return;
      }

      const response = await fetch(
        `${base}/fetch/all/users?q=${encodeURIComponent(searchQuery)}`,
        {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result: SearchResult = await response.json();

      if (result?.success && Array.isArray(result.data)) {
        // filter out nulls and exclude admin roles
        const filteredResults = result.data
          .filter(Boolean)
          .map((u) => u as SearchUser)
          .filter((user) => {
            if (!user) return false;

            // Exclude admin and super-admin roles
            const role = safeLower(user.role);
            if (role === "admin" || role === "super-admin") return false;
            return true;
          });

        // sort: immediately available candidates first, then others
        filteredResults.sort(
          (a, b) =>
            Number(b.immediatelyAvailable === true) -
            Number(a.immediatelyAvailable === true)
        );

        const limited = filteredResults.slice(0, 8);
        setResults(limited);
        // always open the dropdown if there's a query (we show either results or "no results")
        setIsOpen(true);
      } else {
        setResults([]);
        // still open to show "No results..."
        setIsOpen(true);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Search error:", err);
        setResults([]);
        // open so user can see error / no results
        setIsOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (user: SearchUser) => {
    const role = (user.role as Role) || "candidate";
    const id = user.slug ?? "";
    const profileUrl =
      role === "company"
        ? `/cmp/${id}`
        : role === "recruiter"
        ? `/rp/${id}`
        : `/cp/${id}`;

    // 👇 Call parent-provided callback (to close mobile sheet)
    onResultSelect && onResultSelect();

    router.push(profileUrl);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleSeeAllUsers = () => {
    const searchParam = query.trim() ? `?s=${encodeURIComponent(query)}` : "";
    router.push(`/all-users${searchParam}`);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "candidate":
        return <User className="h-4 w-4 text-green-600" />;
      case "recruiter":
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case "company":
        return <Building2 className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const availableCount = results.filter(
    (r) => r.role === "candidate" && r.immediatelyAvailable === true
  ).length;

  return (
    <div ref={searchRef} className="relative w-full max-w-md min-w-[220px]">
      <div className="relative">
        <Search
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        />
      <input
  ref={inputRef}
  type="text"
  placeholder="Search people, companies..."
  value={query}
  onChange={(e) => {
    setQuery(e.target.value);
    if (e.target.value.trim().length > 0) setIsOpen(true);
  }}
  onFocus={() => query.trim().length > 0 && setIsOpen(true)}
  aria-label="Global search"
  className="
    w-full pl-10 pr-9 py-2 
    border border-gray-200 rounded-full bg-gray-50
    focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B98DE] focus:border-transparent
    transition-all duration-200
    text-[16px]          /* Always 16px to prevent Safari zoom */
    leading-5
  "
/>


        {isLoading && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="animate-spin h-4 w-4 border-2 border-[#4B98DE] border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search results"
        >
          {isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-[#4B98DE] border-t-transparent rounded-full" />
                <span className="text-sm">Searching...</span>
              </div>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </div>
                <div className="text-xs text-gray-600">
                  {availableCount > 0 ? (
                    <span
                      className="inline-flex items-center gap-2"
                      aria-hidden={availableCount === 0}
                    >
                      <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                      <span>{availableCount} immediately available</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      No immediate candidates
                    </span>
                  )}
                </div>
              </div>

              {results.map((user) => {
                const id = user._id ?? Math.random().toString(36).slice(2);
                const displayName = user?.name || "Unnamed";
                const firstLetter = (
                  user?.name?.charAt(0) || "U"
                ).toUpperCase();
                const avatarUrl =
                  user?.avatar?.url || "/placeholder.svg?height=40&width=40";

                const isCandidate = user.role === "candidate";
                const isAvailable = user.immediatelyAvailable === true;

                return (
                  <Button
                    key={id}
                    variant="ghost"
                    className="w-full justify-start p-4 h-auto hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleResultClick(user)}
                    role="option"
                    aria-label={`Open profile for ${displayName}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback className="bg-[#4B98DE] text-white">
                          {firstLetter}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {displayName}
                          </span>

                          {/* availability badge for candidates */}
                          {isCandidate && isAvailable && (
                            <span
                              className="ml-2 inline-flex items-center gap-2 text-xs font-medium rounded-full px-2 py-0.5 bg-green-50 text-green-800"
                              aria-label="Immediately available"
                              title="Immediately available"
                            >
                              <span className="h-2 w-2 rounded-full bg-green-600 inline-block" />
                              Immediate
                            </span>
                          )}
                          {getRoleIcon(user?.role as string | undefined)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user?.position ? (
                            <>
                              {user.position} • {user.address || "N/A"}
                            </>
                          ) : (
                            user?.address || "N/A"
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}

              <div className="px-4 py-3 text-center border-t bg-gray-50">
                <Button
                  variant="ghost"
                  className="text-[#4B98DE] hover:text-[#3a7bc8] text-sm font-medium"
                  onClick={handleSeeAllUsers}
                >
                  Show All Results
                </Button>
              </div>
            </>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search
                className="h-8 w-8 mx-auto mb-2 text-gray-300"
                aria-hidden
              />
              <p className="text-sm">
                No results found{query ? ` for "${query}"` : ""}.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for people, companies, or locations
              </p>
              <div className="mt-4">
                <Button
                  variant="ghost"
                  className="text-[#4B98DE] hover:text-[#3a7bc8] text-sm font-medium"
                  onClick={handleSeeAllUsers}
                >
                  Show All Results
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
