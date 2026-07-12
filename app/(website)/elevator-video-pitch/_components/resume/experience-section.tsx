"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import CustomDateInput from "@/components/custom-date-input";
import type { UseFormReturn, FieldArrayWithId } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Combobox } from "@/components/ui/combo-box";

interface Country {
  country: string;
  cities: string[];
}

interface Option {
  value: string;
  label: string;
}

// Utility function to compare dates (format: MM/YYYY)
const isDateValid = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return true; // Skip if either date is empty
  const [startMonth, startYear] = startDate.split("/").map(Number);
  const [endMonth, endYear] = endDate.split("/").map(Number);

  if (startYear > endYear) return false;
  if (startYear === endYear && startMonth > endMonth) return false;
  return true;
};

// ... (keep your existing Combobox component as is)

interface ExperienceSectionProps {
  form: UseFormReturn<any>;
  experienceFields: FieldArrayWithId<any, "experiences", "id">[];
  appendExperience: (value: any) => void;
  removeExperience: (index: number) => void;
}

export function ExperienceSection({
  form,
  experienceFields,
  appendExperience,
  removeExperience,
}: ExperienceSectionProps) {
  const [selectedExperienceCountries, setSelectedExperienceCountries] =
    useState<string[]>([]);
  const [experienceCitiesData, setExperienceCitiesData] = useState<string[][]>(
    []
  );
  const [loadingExperienceCities, setLoadingExperienceCities] = useState<
    boolean[]
  >([]);

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

  const fetchCitiesForCountry = async (country: string): Promise<string[]> => {
    if (!country) return [];
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/countries/cities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country }),
        }
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch cities");
      return data.data as string[];
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchExperienceCities = async () => {
      const newCitiesData: string[][] = [];
      const newLoadingStates: boolean[] = [];

      for (let index = 0; index < experienceFields.length; index++) {
        const country = selectedExperienceCountries[index] || "";
        newLoadingStates[index] = !!country;

        if (country) {
          const cities = await fetchCitiesForCountry(country);
          newCitiesData[index] = cities;
        } else {
          newCitiesData[index] = [];
        }
        newLoadingStates[index] = false;
      }

      setExperienceCitiesData(newCitiesData);
      setLoadingExperienceCities(newLoadingStates);
    };

    fetchExperienceCities();
  }, [experienceFields.length, selectedExperienceCountries]);

  // Sync experience countries state with form data
  useEffect(() => {
    setSelectedExperienceCountries(
      experienceFields.map(
        (field, idx) => form.getValues(`experiences.${idx}.country`) || ""
      )
    );
  }, [experienceFields]);

  // Validate dates whenever startDate or endDate changes
  useEffect(() => {
    experienceFields.forEach((_, index) => {
      const startDate = form.getValues(`experiences.${index}.startDate`);
      const endDate = form.getValues(`experiences.${index}.endDate`);
      const currentlyWorking = form.getValues(
        `experiences.${index}.currentlyWorking`
      );

      if (!currentlyWorking && startDate && endDate) {
        if (!isDateValid(startDate, endDate)) {
          form.setError(`experiences.${index}.endDate`, {
            type: "manual",
            message: "End date cannot be earlier than start date",
          });
        } else {
          form.clearErrors(`experiences.${index}.endDate`);
        }
      }
    });
  }, [form, experienceFields]);

  const countryOptions = useMemo(
    () =>
      countriesData?.map((c) => ({ value: c.country, label: c.country })) || [],
    [countriesData]
  );

  const experienceCityOptions = useMemo(() => {
    return experienceCitiesData.map(
      (cities) => cities?.map((c) => ({ value: c, label: c })) || []
    );
  }, [experienceCitiesData]);

  return (
    <div>
      <div className="mb-4">
        <CardTitle>Work Experience</CardTitle>
      </div>
      <div className="space-y-4">
        {experienceFields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Position Field */}
              <FormField
                control={form.control}
                name={`experiences.${index}.position`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Field */}
              <FormField
                control={form.control}
                name={`experiences.${index}.company`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country Field */}
              <FormField
                control={form.control}
                name={`experiences.${index}.country`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Combobox
                        options={countryOptions}
                        value={field.value || ""}
                        onChange={(value) => {
                          field.onChange(value);
                          setSelectedExperienceCountries((prev) => {
                            const newCountries = [...prev];
                            newCountries[index] = value;
                            return newCountries;
                          });
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

              {/* City Field */}
              <FormField
                control={form.control}
                name={`experiences.${index}.city`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Combobox
                        options={experienceCityOptions[index] || []}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={
                          !selectedExperienceCountries[index]
                            ? "Select country first"
                            : loadingExperienceCities[index]
                            ? "Loading cities..."
                            : "Select City"
                        }
                        minSearchLength={2}
                        disabled={
                          loadingExperienceCities[index] ||
                          !selectedExperienceCountries[index]
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Fields */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name={`experiences.${index}.currentlyWorking`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked: boolean) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue(`experiences.${index}.endDate`, "");
                              form.clearErrors(`experiences.${index}.endDate`);
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Current Position
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`experiences.${index}.startDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <CustomDateInput
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            // Trigger validation for end date
                            const endDate = form.getValues(
                              `experiences.${index}.endDate`
                            );
                            const currentlyWorking = form.getValues(
                              `experiences.${index}.currentlyWorking`
                            );
                            if (!currentlyWorking && endDate && value) {
                              if (!isDateValid(value, endDate)) {
                                form.setError(`experiences.${index}.endDate`, {
                                  type: "manual",
                                  message:
                                    "End date cannot be earlier than start date",
                                });
                              } else {
                                form.clearErrors(
                                  `experiences.${index}.endDate`
                                );
                              }
                            }
                          }}
                          placeholder="MM/YYYY"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`experiences.${index}.endDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <CustomDateInput
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            // Validate against start date
                            const startDate = form.getValues(
                              `experiences.${index}.startDate`
                            );
                            const currentlyWorking = form.getValues(
                              `experiences.${index}.currentlyWorking`
                            );
                            if (!currentlyWorking && startDate && value) {
                              if (!isDateValid(startDate, value)) {
                                form.setError(`experiences.${index}.endDate`, {
                                  type: "manual",
                                  message:
                                    "End date cannot be earlier than start date",
                                });
                              } else {
                                form.clearErrors(
                                  `experiences.${index}.endDate`
                                );
                              }
                            }
                          }}
                          placeholder="MM/YYYY"
                          disabled={form.watch(
                            `experiences.${index}.currentlyWorking`
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Job Description */}
            <FormField
              control={form.control}
              name={`experiences.${index}.jobDescription`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your responsibilities and achievements"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remove Button */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeExperience(index)}
            >
              Remove Experience
            </Button>
          </div>
        ))}

        {/* Add More Button */}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            appendExperience({
              company: "",
              position: "",
              duration: "",
              startDate: "",
              endDate: "",
              country: "",
              city: "",
              zip: "",
              jobDescription: "",
              jobCategory: "",
              currentlyWorking: false,
            })
          }
          className="flex items-center gap-2"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
