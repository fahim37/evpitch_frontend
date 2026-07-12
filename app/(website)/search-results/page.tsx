"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  User,
  Building2,
  UserCheck,
  ArrowLeft,
  Filter,
  MapPin,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Wrapper component that provides the required Suspense boundary
 * around any hook that reads router state (e.g., useSearchParams()).
 */
export default function SearchResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#4B98DE] border-t-transparent rounded-full" />
        </div>
      }
    >
      <SearchResultsInner />
    </Suspense>
  );
}

interface SearchUser {
  _id: string;
  name: string;
  role: "candidate" | "recruiter" | "company";
  phoneNum: string;
  address: string;
  slug: string;
  avatar: {
    url: string;
  };
}

interface SearchResult {
  success: boolean;
  message: string;
  data: SearchUser[];
}

/**
 * All the original page logic lives here. This component is rendered
 * inside the Suspense boundary so useSearchParams() is safe.
 */
function SearchResultsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // keep `query` in sync with the URL's `?q=` when it changes
  const initialQuery = useMemo(() => searchParams.get("q") || "", [searchParams]);
  const [query, setQuery] = useState(initialQuery);

  const [results, setResults] = useState<SearchUser[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // If the URL param changes (e.g., via navigation), reflect it in state
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (query) {
      searchUsers(query);
    } else {
      // if query is cleared, reset lists
      setResults([]);
      setFilteredResults([]);
      setAvailableLocations([]);
    }
  }, [query]);

  useEffect(() => {
    applyFilters();
  }, [results, roleFilter, locationFilter]);

  const searchUsers = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/fetch/all/users`
      );
      const result: SearchResult = await response.json();

      if (result.success) {
        const searchTerm = searchQuery.toLowerCase();
        const filtered = result.data.filter((user) => {
          const nameLower = user.name.toLowerCase();
          const roleLower = user.role.toLowerCase();
          const addressLower = user.address.toLowerCase();

          return (
            nameLower.includes(searchTerm) ||
            roleLower.includes(searchTerm) ||
            addressLower.includes(searchTerm) ||
            user.phoneNum.includes(searchTerm) ||
            nameLower.split(" ").some((word) => word.startsWith(searchTerm)) ||
            addressLower.split(" ").some((word) => word.startsWith(searchTerm))
          );
        });

        setResults(filtered);

        // unique locations from filtered results
        const locations = Array.from(
          new Set(
            filtered
              .map((u) => u.address?.trim())
              .filter((addr): addr is string => Boolean(addr))
          )
        );
        setAvailableLocations(locations);
      } else {
        setResults([]);
        setAvailableLocations([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setAvailableLocations([]);
    } finally {
      setIsLoading(false);
    }
  };



  const applyFilters = () => {
    let filtered = [...results];

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((user) => user.address === locationFilter);
    }

    setFilteredResults(filtered);
  };

  const handleResultClick = (user: SearchUser) => {
    const profileUrl =
      user.role === "company"
        ? `/cmp/${user.slug}`
        : user.role === "recruiter"
        ? `/rp/${user.slug}`
        : `/cp/${user.slug}`;

    router.push(profileUrl);
  };



  const handleNewSearch: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      // optionally keep the URL in sync
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("q", trimmed);
      router.push(`/search-results?${params.toString()}`);
      searchUsers(trimmed);
    }
  };

  const getRoleIcon = (role: string) => {
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

  const getRoleLabel = (role: string) =>
    role.charAt(0).toUpperCase() + role.slice(1);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "candidate":
        return " text-green-800";
      case "recruiter":
        return "text-blue-800";
      case "company":
        return "btext-purple-800";
      default:
        return "text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-2">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className=" px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
          </div>

          {/* Search Form */}
          <form onSubmit={handleNewSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search people, companies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </form>
        </div>
      </div>

      <div className="py-6">
        {/* Filters and Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">
              {filteredResults.length} result
              {filteredResults.length !== 1 ? "s" : ""} found
            </span>
            {query && (
              <span>
                for "
                <span className="font-medium text-gray-900">{query}</span>
                "
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="candidate">Candidate</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {availableLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-[#4B98DE] border-t-transparent rounded-full" />
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleResultClick(user)}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={
                        user.avatar.url || "/placeholder.svg?height=64&width=64"
                      }
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-[#4B98DE] text-white text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.name}
                      </h3>
                    </div>

                    <div className="flex gap-4">
                      <span
                        className={`text-base font-medium ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>

                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-[#4B98DE]" />
                        {user.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found.</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search terms or filters.</p>
            <Button
              variant="outline"
              onClick={() => {
                setRoleFilter("all");
                setLocationFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
