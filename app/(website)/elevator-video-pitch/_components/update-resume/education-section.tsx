"use client";

import type { UseFormReturn } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CustomDateInput } from "./custom-date-input";
import { UniversitySelector } from "./university-selector";
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
  if (!startDate || !endDate) return true;
  const [startMonth, startYear] = startDate.split("/").map(Number);
  const [endMonth, endYear] = endDate.split("/").map(Number);
  if (startYear > endYear) return false;
  if (startYear === endYear && startMonth > endMonth) return false;
  return true;
};

interface EducationSectionProps {
  form: UseFormReturn<any>;
}

export const EducationSection = ({ form }: EducationSectionProps) => {
  const educationList = form.watch("educationList") || [];
  const [selectedEducationCountries, setSelectedEducationCountries] = useState<
    string[]
  >([]);
  const [educationCitiesData, setEducationCitiesData] = useState<string[][]>(
    []
  );
  const [loadingEducationCities, setLoadingEducationCities] = useState<
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

  // Sync education countries state with form data
  useEffect(() => {
    const initialCountries = educationList.map((edu: any) => edu.country || "");
    setSelectedEducationCountries(initialCountries);
  }, [educationList.length]);

  // Fetch cities for all education entries when countries change
  useEffect(() => {
    const fetchEducationCities = async () => {
      const newCitiesData: string[][] = [];
      const newLoadingStates: boolean[] = [];

      for (let index = 0; index < educationList.length; index++) {
        const country = selectedEducationCountries[index] || "";
        newLoadingStates[index] = !!country;

        if (country) {
          const cities = await fetchCitiesForCountry(country);
          newCitiesData[index] = cities;
        } else {
          newCitiesData[index] = [];
        }
        newLoadingStates[index] = false;
      }

      setEducationCitiesData(newCitiesData);
      setLoadingEducationCities(newLoadingStates);
    };

    if (educationList.length > 0) {
      fetchEducationCities();
    }
  }, [educationList.length, selectedEducationCountries]);

  // Validate dates whenever startDate or graduationDate changes
  useEffect(() => {
    educationList.forEach((_: any, index: number) => {
      const startDate = form.getValues(`educationList.${index}.startDate`);
      const graduationDate = form.getValues(
        `educationList.${index}.graduationDate`
      );
      const currentlyStudying = form.getValues(
        `educationList.${index}.currentlyStudying`
      );

      if (!currentlyStudying && startDate && graduationDate) {
        if (!isDateValid(startDate, graduationDate)) {
          form.setError(`educationList.${index}.graduationDate`, {
            type: "manual",
            message: "Graduation date cannot be earlier than start date",
          });
        } else {
          form.clearErrors(`educationList.${index}.graduationDate`);
        }
      }
    });
  }, [form, educationList]);

  const countryOptions = useMemo(
    () =>
      countriesData?.map((c) => ({ value: c.country, label: c.country })) || [],
    [countriesData]
  );

  const educationCityOptions = useMemo(() => {
    return educationCitiesData.map(
      (cities) => cities?.map((c) => ({ value: c, label: c })) || []
    );
  }, [educationCitiesData]);

  return (
    <div>
      <div className="space-y-2 mb-4">
        <h3>Education</h3>
        <p className="text-sm text-muted-foreground">
          Showcase your academic background and qualifications.
        </p>
      </div>
      <div>
        {educationList.map((education: any, index: number) => {
          if (education.type === "delete") return null;

          return (
            <div key={index} className="space-y-4 rounded-lg border p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`educationList.${index}.instituteName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institute Name*</FormLabel>
                      <FormControl>
                        <UniversitySelector
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Type your University/College/High School"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`educationList.${index}.degree`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a qualification" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BSc">BSc</SelectItem>
                            <SelectItem value="B.Tech">B.Tech</SelectItem>
                            <SelectItem value="B.A">B.A</SelectItem>
                            <SelectItem value="B.Ed">B.Ed</SelectItem>
                            <SelectItem value="B.Eng">B.Eng</SelectItem>
                            <SelectItem value="LLB">LLB</SelectItem>
                            <SelectItem value="LLM">LLM</SelectItem>
                            <SelectItem value="M.B.A">M.B.A</SelectItem>
                            <SelectItem value="MSc">MSc</SelectItem>
                            <SelectItem value="M.Phil">M.Phil</SelectItem>
                            <SelectItem value="M.Eng">M.Eng</SelectItem>

                            <SelectItem value="Ph.D">Ph.D</SelectItem>
                            <SelectItem value="High School">
                              High School
                            </SelectItem>
                            <SelectItem value="College">College</SelectItem>
                            <SelectItem value="Sixth Form">
                              Sixth Form
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`educationList.${index}.fieldOfStudy`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Of Study</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Computer Science/Medicine/Civil Engineering"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country Field */}
                <FormField
                  control={form.control}
                  name={`educationList.${index}.country`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Combobox
                          options={countryOptions}
                          value={field.value || ""}
                          onChange={(value) => {
                            field.onChange(value);
                            setSelectedEducationCountries((prev) => {
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
                  name={`educationList.${index}.city`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Combobox
                          options={educationCityOptions[index] || []}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder={
                            !selectedEducationCountries[index]
                              ? "Select country first"
                              : loadingEducationCities[index]
                              ? "Loading cities..."
                              : "Select City"
                          }
                          minSearchLength={2}
                          disabled={
                            loadingEducationCities[index] ||
                            !selectedEducationCountries[index]
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`educationList.${index}.startDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <CustomDateInput
                          value={field.value || ""}
                          onChange={(value) => {
                            field.onChange(value);
                            const graduationDate = form.getValues(
                              `educationList.${index}.graduationDate`
                            );
                            const currentlyStudying = form.getValues(
                              `educationList.${index}.currentlyStudying`
                            );
                            if (!currentlyStudying && graduationDate && value) {
                              if (!isDateValid(value, graduationDate)) {
                                form.setError(
                                  `educationList.${index}.graduationDate`,
                                  {
                                    type: "manual",
                                    message:
                                      "Graduation date cannot be earlier than start date",
                                  }
                                );
                              } else {
                                form.clearErrors(
                                  `educationList.${index}.graduationDate`
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

                {!education.currentlyStudying && (
                  <FormField
                    control={form.control}
                    name={`educationList.${index}.graduationDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation Date</FormLabel>
                        <FormControl>
                          <CustomDateInput
                            value={field.value || ""}
                            onChange={(value) => {
                              field.onChange(value);
                              const startDate = form.getValues(
                                `educationList.${index}.startDate`
                              );
                              if (startDate && value) {
                                if (!isDateValid(startDate, value)) {
                                  form.setError(
                                    `educationList.${index}.graduationDate`,
                                    {
                                      type: "manual",
                                      message:
                                        "Graduation date cannot be earlier than start date",
                                    }
                                  );
                                } else {
                                  form.clearErrors(
                                    `educationList.${index}.graduationDate`
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
                )}
                <FormField
                  control={form.control}
                  name={`educationList.${index}.currentlyStudying`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue(
                                `educationList.${index}.graduationDate`,
                                ""
                              );
                              form.clearErrors(
                                `educationList.${index}.graduationDate`
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Currently Studying
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              {educationList.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const currentEducation =
                      form.getValues("educationList") || [];
                    const educationToRemove = currentEducation[index];

                    if (educationToRemove._id) {
                      const updatedEducation = [...currentEducation];
                      updatedEducation[index] = {
                        ...educationToRemove,
                        type: "delete",
                      };
                      form.setValue("educationList", updatedEducation);
                    } else {
                      const updatedEducation = currentEducation.filter(
                        (_: any, i: number) => i !== index
                      );
                      form.setValue("educationList", updatedEducation);
                    }
                  }}
                >
                  Remove Education
                </Button>
              )}
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const currentEducation = form.getValues("educationList") || [];
            form.setValue("educationList", [
              ...currentEducation,
              {
                type: "create",
                instituteName: "",
                degree: "",
                fieldOfStudy: "",
                startDate: "",
                graduationDate: "",
                currentlyStudying: false,
                city: "",
                country: "",
              },
            ]);
          }}
        >
          Add Education
        </Button>
      </div>
    </div>
  );
};
