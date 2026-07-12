"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import { SocialLinksSection } from "../social-links-section";
import { useQuery } from "@tanstack/react-query";
import { PhotoUpload } from "../update-resume/photo-upload";
import type { UseFormReturn } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";

const ABOUT_MIN_WORDS = 1;
const ABOUT_MAX_WORDS = 200;

const getWordCount = (value?: string | null) => {
  const text = value?.trim() ?? "";
  return text ? text.split(/\s+/).length : 0;
};

interface Country {
  country: string;
  cities: string[];
}

interface DialCode {
  name: string;
  code: string;
  dial_code: string;
}

interface Option {
  value: string;
  label: string;
}

interface PersonalInfoSectionProps {
  form: UseFormReturn<any>;
  photoPreview: string | null;
  onPhotoUpload: (file: File | null) => void;
}

function Combobox({
  options,
  value,
  onChange,
  placeholder,
  minSearchLength = 0,
  disabled = false,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minSearchLength?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  const displayedOptions = filteredOptions.slice(0, 100);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < minSearchLength ? (
              <CommandEmpty>
                Type at least {minSearchLength} characters to search.
              </CommandEmpty>
            ) : displayedOptions.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {displayedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredOptions.length > 100 && (
              <CommandItem disabled>
                More results available. Refine your search.
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function PersonalInfoSection({
  form,
  photoPreview,
  onPhotoUpload,
}: PersonalInfoSectionProps) {
  const formCountry = form.watch("country");
  const [selectedCountry, setSelectedCountry] = useState<string>(
    formCountry || ""
  );

  // Fetch countries
  const { data: countriesData, isLoading: isLoadingCountries } = useQuery<
    Country[]
  >({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/countries`
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch countries");
      return data.data as Country[];
    },
  });

  // Fetch dial codes
  const { data: dialCodesData, isLoading: isLoadingDialCodes } = useQuery<
    DialCode[]
  >({
    queryKey: ["dialCodes"],
    queryFn: async () => {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/codes"
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch dial codes");
      return data.data as DialCode[];
    },
  });

  // Fetch cities for Personal Information
  const { data: citiesData, isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ["cities", selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return [];
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/countries/cities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country: selectedCountry }),
        }
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch cities");
      return data.data as string[];
    },
    enabled: !!selectedCountry,
  });

  const countryOptions = useMemo(
    () =>
      countriesData?.map((c) => ({ value: c.country, label: c.country })) || [],
    [countriesData]
  );

  const cityOptions = useMemo(
    () => citiesData?.map((c) => ({ value: c, label: c })) || [],
    [citiesData]
  );

  // Handle country data side effects
  useEffect(() => {
    if (
      countriesData &&
      countriesData.length > 0 &&
      !formCountry &&
      !selectedCountry
    ) {
      const defaultCountry = countriesData[0].country;
      setSelectedCountry(defaultCountry);
      form.setValue("country", defaultCountry);
    }
    if (formCountry && formCountry !== selectedCountry) {
      setSelectedCountry(formCountry);
    }
  }, [countriesData, form, formCountry, selectedCountry]);

  return (
    <>
      {/* About Us Section */}
      <div className="border border-gray-400 rounded-lg p-4 lg:p-6">
        <div className="">
          <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
            {/* Photo Upload with Cropper */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-blue-600 font-medium">
                  Profile photo
                </FormLabel>
              </div>
              <div className="border border-gray-400 rounded-lg p-6 w-full max-w-[250px] h-[250px] flex items-center justify-center overflow-hidden">
                <PhotoUpload
                  onFileSelect={onPhotoUpload}
                  previewUrl={photoPreview}
                />
              </div>
            </div>

            {/* About Us Text Area */}
            <div className="col-span-6 flex-1">
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-blue-600 font-medium">
                  About Me
                </FormLabel>
              </div>
              <FormField
                control={form.control}
                name="aboutUs"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Minimum {ABOUT_MIN_WORDS} word. Maximum {ABOUT_MAX_WORDS} words. Current:{" "}
                      {getWordCount(field.value)}/{ABOUT_MAX_WORDS}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <div className="mb-4">
          <CardTitle>Personal Information</CardTitle>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Your First Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surname*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Your Last Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country*</FormLabel>
                  <FormControl>
                    <Combobox
                      options={countryOptions}
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                        setSelectedCountry(value);
                      }}
                      placeholder={
                        isLoadingCountries
                          ? "Loading countries..."
                          : "Select Country"
                      }
                      minSearchLength={0}
                      disabled={isLoadingCountries}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City*</FormLabel>
                  <FormControl>
                    <Combobox
                      options={cityOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={
                        !selectedCountry
                          ? "Select country first"
                          : isLoadingCities
                          ? "Loading cities..."
                          : "Select City"
                      }
                      minSearchLength={2}
                      disabled={isLoadingCities || !selectedCountry}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address*</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter Your Email Address"
                      disabled
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-5 lg:space-y-0 lg:mt-7">
              <FormField
                control={form.control}
                name="immediatelyAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal">
                        Immediately Available
                      </FormLabel>
                      <FormDescription>
                        Check if you are available to start immediately
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <SocialLinksSection form={form} />
        </div>
      </div>
    </>
  );
}
