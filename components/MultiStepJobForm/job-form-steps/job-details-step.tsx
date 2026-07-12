"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronsUpDown } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { JobFormData } from "@/types/job";

interface JobCategory {
  _id: string;
  name: string;
  role: string[];
  categoryIcon: string;
}

interface Country {
  country: string;
  cities: string[];
}

interface JobCategoriesResponse {
  success: boolean;
  message: string;
  data: {
    category: JobCategory[];
  };
}

// ---- Currency API types ----
interface CurrencyApiItem {
  _id: string;
  code: string; // e.g., "USD"
  currencyName: string; // e.g., "United States Dollar"
  primaryCountry?: string;
  symbol?: string; // e.g., "$"
}

// Form values
type FormValues = JobFormData & {
  compensationCurrency?: string;
  compensation?: string | number;
};

interface JobDetailsStepProps {
  form: UseFormReturn<FormValues>;
  onNext: () => void;
  onCancel: () => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  selectedCategoryRoles: string[];
  setSelectedCategoryRoles: (roles: string[]) => void;
  jobCategories: JobCategoriesResponse;
  categoriesLoading: boolean;
  categoriesError: string | null;
  countries: Country[];
  isLoadingCountries: boolean;
  cities: string[];
  isLoadingCities: boolean;
}

// Helpers
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const digitsOnly = (s: string) => s.replace(/[^0-9.]/g, "");
const formatNumber = (n: number | string) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    typeof n === "string" ? Number(n) : n
  );

export default function JobDetailsStep({
  form,
  onNext,
  onCancel,
  selectedCountry,
  setSelectedCountry,
  selectedCategoryRoles,
  setSelectedCategoryRoles,
  jobCategories,
  categoriesLoading,
  categoriesError,
  countries,
  isLoadingCountries,
  cities,
  isLoadingCities,
}: JobDetailsStepProps) {
  // ---- Currency API state ----
  const [currencies, setCurrencies] = useState<CurrencyApiItem[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] =
    useState<boolean>(false);
  const [currenciesError, setCurrenciesError] = useState<string | null>(null);

  // Track if job title was auto-filled
  const [isJobTitleAutoFilled, setIsJobTitleAutoFilled] = useState(false);

  const loadCurrencies = useCallback(async () => {
    const controller = new AbortController();
    setIsLoadingCurrencies(true);
    setCurrenciesError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/courency`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list: CurrencyApiItem[] = Array.isArray(json?.data)
        ? json.data
        : [];
      setCurrencies(list);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setCurrenciesError("Failed to load currencies.");
      }
    } finally {
      setIsLoadingCurrencies(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    void loadCurrencies();
  }, [loadCurrencies]);

  // --- Compensation display state (amount only; form stores "SYMBOL 10000") ---
  const selectedCurrencyCode = form.watch("compensationCurrency") || "";
  const selectedCurrency = useMemo(
    () => currencies.find((c) => c.code === selectedCurrencyCode),
    [currencies, selectedCurrencyCode]
  );
  const currencySymbol = useMemo(
    () => selectedCurrency?.symbol || "$",
    [selectedCurrency]
  );

  const initialComp = form.getValues("compensation");
  const [compensationDisplay, setCompensationDisplay] = useState<string>(() => {
    if (typeof initialComp === "string" && initialComp.trim()) {
      const numeric = digitsOnly(initialComp);
      return numeric ? formatNumber(numeric) : "";
    } else if (typeof initialComp === "number" && !Number.isNaN(initialComp)) {
      return formatNumber(initialComp);
    }
    return "";
  });

  useEffect(() => {
    const digits = digitsOnly(compensationDisplay);
    const sym = currencySymbol || "";
    form.setValue("compensation", digits ? `${sym} ${digits}` : "", {
      shouldValidate: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencySymbol]);

  // --- NEW: popover open states to auto-close on select ---
  const [openCountry, setOpenCountry] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [openRole, setOpenRole] = useState(false);
  const [openCurrency, setOpenCurrency] = useState(false);

  // Auto-fill job title when role is selected
  const handleRoleSelect = (role: string) => {
    form.setValue("role", role, {
      shouldValidate: true,
    });

    // Auto-fill job title with the selected role
    const currentJobTitle = form.getValues("jobTitle");
    if (!currentJobTitle || isJobTitleAutoFilled) {
      form.setValue("jobTitle", role, {
        shouldValidate: true,
      });
      setIsJobTitleAutoFilled(true);
    }

    setOpenRole(false);
  };

  // Reset auto-fill flag when user manually edits job title
  const handleJobTitleChange = (value: string) => {
    form.setValue("jobTitle", value, {
      shouldValidate: true,
    });

    // If user manually edits the field, clear the auto-fill flag
    if (isJobTitleAutoFilled) {
      setIsJobTitleAutoFilled(false);
    }
  };

  return (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Job Details
        </h2>

        {categoriesError && (
          <div className="text-red-600 mb-4 text-center">
            {categoriesError}
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {/* Category & Role - Moved to top */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category (auto-close) */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Job Category<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Popover open={openCategory} onOpenChange={setOpenCategory}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "h-11 justify-between border-gray-300 focus:border-[#2B7FD0]",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={
                            categoriesLoading || categoriesError !== null
                          }
                        >
                          {field.value
                            ? jobCategories?.data?.category?.find(
                                (c) => c._id === field.value
                              )?.name
                            : "Select category"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search category..." />
                        <CommandList>
                          <CommandEmpty>
                            {categoriesLoading
                              ? "Loading categories..."
                              : "No category found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {jobCategories?.data?.category?.length ? (
                              jobCategories.data.category.map((category) => (
                                <CommandItem
                                  value={category.name}
                                  key={category._id}
                                  onSelect={() => {
                                    form.setValue("categoryId", category._id, {
                                      shouldValidate: true,
                                    });
                                    form.setValue("role", "", {
                                      shouldValidate: true,
                                    });
                                    // Only clear job title if it was auto-filled from previous role
                                    if (isJobTitleAutoFilled) {
                                      form.setValue("jobTitle", "", {
                                        shouldValidate: true,
                                      });
                                    }
                                    setSelectedCategoryRoles(
                                      category.role || []
                                    );
                                    setIsJobTitleAutoFilled(false);
                                    setOpenCategory(false);
                                  }}
                                >
                                  {category.name}
                                </CommandItem>
                              ))
                            ) : (
                              <CommandEmpty>
                                No categories available.
                              </CommandEmpty>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role (dependent, auto-close) */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Role<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Popover open={openRole} onOpenChange={setOpenRole}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "h-11 justify-between border-gray-300 focus:border-[#2B7FD0]",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={!selectedCategoryRoles.length}
                        >
                          {field.value || "Select role"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search role..." />
                        <CommandList>
                          <CommandEmpty>
                            {selectedCategoryRoles.length === 0
                              ? "Please select a category first"
                              : "No role found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {selectedCategoryRoles.map((role) => (
                              <CommandItem
                                value={role}
                                key={role}
                                onSelect={() => handleRoleSelect(role)}
                              >
                                {role}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                  {selectedCategoryRoles.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a category first to see available roles
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>

          {/* Job Title - Now third field with auto-fill info */}
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Job Title<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  {isJobTitleAutoFilled && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Auto-filled from role
                    </span>
                  )}
                </div>
                <FormControl>
                  <Input
                    placeholder="Enter job title"
                    className="h-11 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                    value={field.value}
                    onChange={(e) => handleJobTitleChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
                {isJobTitleAutoFilled && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You can customize the job title if needed
                  </p>
                )}
              </FormItem>
            )}
          />

          {/* Country & City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Country (auto-close) */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Country<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Popover open={openCountry} onOpenChange={setOpenCountry}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "h-11 justify-between border-gray-300 focus:border-[#2B7FD0]",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? countries.find((c) => c.country === field.value)
                                ?.country
                            : "Select country"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingCountries
                              ? "Loading countries..."
                              : "No country found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {countries.map((country) => (
                              <CommandItem
                                value={country.country}
                                key={country.country}
                                onSelect={() => {
                                  form.setValue("country", country.country, {
                                    shouldValidate: true,
                                  });
                                  form.setValue("region", "", {
                                    shouldValidate: true,
                                  });
                                  setSelectedCountry(country.country);
                                  setOpenCountry(false);
                                }}
                              >
                                {country.country}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City (auto-close) */}
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    City<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Popover open={openCity} onOpenChange={setOpenCity}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!selectedCountry || isLoadingCities}
                          className={cn(
                            "h-11 justify-between border-gray-300 focus:border-[#2B7FD0]",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ||
                            (isLoadingCities
                              ? "Loading cities..."
                              : "Select city")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0">
                      <Command>
                        <CommandInput placeholder="Search city..." />
                        <CommandList>
                          <CommandEmpty>No city found.</CommandEmpty>
                          <CommandGroup>
                            {cities.map((city) => (
                              <CommandItem
                                value={city}
                                key={city}
                                onSelect={() => {
                                  form.setValue("region", city, {
                                    shouldValidate: true,
                                  });
                                  setOpenCity(false);
                                }}
                              >
                                {city}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Vacancies */}
          <FormField
            control={form.control}
            name="vacancy"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Number of Vacancies
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={50}
                    step={1}
                    placeholder="Enter number of vacancies (1–50)"
                    className="h-11 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                    value={field.value && field.value > 0 ? field.value : ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        field.onChange(undefined);
                        return;
                      }
                      const n = clamp(Number(raw), 1, 50);
                      field.onChange(Number.isNaN(n) ? undefined : n);
                    }}
                    onBlur={(e) => {
                      const n = clamp(Number(e.target.value || 1), 1, 50);
                      field.onChange(n);
                    }}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">Maximum 50</p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Employment & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="employement_Type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Employment Type<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#2B7FD0]">
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Experience Level<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus-border-[#2B7FD0] focus:border-[#2B7FD0]">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Location Type & Career Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="locationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Location Type<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#2B7FD0]">
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="careerStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Career Stage<span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-[#2B7FD0]">
                        <SelectValue placeholder="Select career stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="New Entry">New Entry</SelectItem>
                      <SelectItem value="Experienced Professional">
                        Experienced Professional
                      </SelectItem>
                      <SelectItem value="Career Returner">
                        Career Returner
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Compensation: currency combobox (auto-close) + amount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Currency combobox (API-driven, searchable) */}
            <FormField
              control={form.control}
              name="compensationCurrency"
              render={({ field }) => {
                const current = currencies.find((c) => c.code === field.value);
                const label = current
                  ? `${current.currencyName} (${current.code}) ${
                      current.symbol || ""
                    }`
                  : "Select currency";
                return (
                  <FormItem className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Currency
                      </FormLabel>
                      {currenciesError && (
                        <button
                          type="button"
                          className="text-xs text-red-600 underline"
                          onClick={() => loadCurrencies()}
                        >
                          Retry
                        </button>
                      )}
                    </div>

                    <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "h-11 justify-between border-gray-300 focus:border-[#2B7FD0]",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoadingCurrencies}
                          >
                            {label}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>

                      <PopoverContent className="w-[320px] p-0">
                        <Command shouldFilter>
                          <CommandInput placeholder="Search currency or code…" />
                          <CommandList>
                            <CommandEmpty>
                              {isLoadingCurrencies
                                ? "Loading currencies…"
                                : "No currency found."}
                            </CommandEmpty>
                            {!isLoadingCurrencies && (
                              <CommandGroup>
                                {currencies.map((c) => {
                                  const itemLabel = `${c.currencyName} (${
                                    c.code
                                  }) ${c.symbol || ""}`;
                                  return (
                                    <CommandItem
                                      key={c.code}
                                      value={`${c.code} ${c.currencyName} ${
                                        c.symbol || ""
                                      }`}
                                      onSelect={() => {
                                        field.onChange(c.code);
                                        const digits = (
                                          compensationDisplay || ""
                                        ).replace(/[^0-9.]/g, "");
                                        const sym = c.symbol || "";
                                        form.setValue(
                                          "compensation",
                                          digits ? `${sym} ${digits}` : "",
                                          { shouldValidate: true }
                                        );
                                        setOpenCurrency(false);
                                      }}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className="truncate">
                                          {c.currencyName}
                                        </span>
                                        <span className="ml-2 shrink-0 text-muted-foreground">
                                          ({c.code}) {c.symbol || ""}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <FormMessage />
                    {isLoadingCurrencies && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Fetching currencies…
                      </p>
                    )}
                  </FormItem>
                );
              }}
            />

            {/* Amount input */}
            <FormField
              control={form.control}
              name="compensation"
              render={() => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Compensation (Optional)
                  </FormLabel>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none select-none">
                      {currencySymbol}
                    </span>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g., 50,000"
                      className="h-11 pl-11 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                      value={compensationDisplay}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const sanitized = digitsOnly(raw);
                        const pretty = sanitized ? formatNumber(sanitized) : "";
                        setCompensationDisplay(pretty);
                        const toStore = sanitized
                          ? `${currencySymbol} ${sanitized}`
                          : "";
                        form.setValue("compensation", toStore, {
                          shouldValidate: true,
                        });
                      }}
                      onBlur={() => {
                        const current = digitsOnly(compensationDisplay);
                        setCompensationDisplay(
                          current ? formatNumber(current) : ""
                        );
                        const toStore = current
                          ? `${currencySymbol} ${current}`
                          : "";
                        form.setValue("compensation", toStore, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Expiration */}
          <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Job Posting Expiration (Days)
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-[#2B7FD0]">
                      <SelectValue placeholder="Select expiration period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Company URL */}
          <FormField
            control={form.control}
            name="companyUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Company Website (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com"
                    className="h-11 border-gray-300 focus:border-[#2B7FD0] focus:ring-[#2B7FD0]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            className="border border-[#2B7FD0] h-11 px-6 text-[#2B7FD0] hover:bg-transparent bg-transparent"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-11 px-6 bg-[#2B7FD0] hover:bg-[#2B7FD0]/85"
            onClick={() => {
              const v = form.getValues("vacancy") as number | undefined;
              if (typeof v === "number") {
                form.setValue("vacancy", clamp(v, 1, 50) as any, {
                  shouldValidate: true,
                });
              }
              onNext();
            }}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
