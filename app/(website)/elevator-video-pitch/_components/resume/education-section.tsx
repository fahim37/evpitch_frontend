"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Country {
  country: string;
  cities: string[];
}

interface University {
  _id: string;
  name: string;
  country: string;
}

interface Option {
  value: string;
  label: string;
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

function UniversitySelector({
  value,
  onChange,
  placeholder = "Type your University/College/High School",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filteredUniversities, setFilteredUniversities] = useState<
    University[]
  >([]);
  const [allUniversities, setAllUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch universities from API
  useEffect(() => {
    const fetchUniversities = async () => {
      setIsLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "{{base_url}}";
        const response = await fetch(`${baseUrl}/university`);
        const data = await response.json();
        if (data.status === "success") {
          setAllUniversities(data.data);
        }
      } catch (err) {
        console.error("Error fetching universities:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUniversities();
  }, []);

  // Filter universities based on search
  useEffect(() => {
    if (search.trim() && search.length >= 2) {
      const filtered = allUniversities.filter(
        (university) =>
          university.name.toLowerCase().includes(search.toLowerCase()) ||
          university.country.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUniversities(filtered.slice(0, 10)); // Limit to 10 results for performance
      setShowDropdown(true);
    } else {
      setFilteredUniversities([]);
      setShowDropdown(false);
    }
  }, [search, allUniversities]);

  const handleUniversitySelect = (universityName: string) => {
    onChange(universityName);
    setSearch(universityName);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearch(inputValue);
    onChange(inputValue);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={search || value}
          onChange={handleInputChange}
          onFocus={() => {
            if (search.length >= 2) setShowDropdown(true);
          }}
          onBlur={() => {
            // Delay hiding dropdown to allow clicks
            setTimeout(() => setShowDropdown(false), 200);
          }}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      {/* Loading indicator */}
      {isLoading && search && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow p-2 text-sm text-gray-600">
          Loading universities...
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && filteredUniversities.length > 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow max-h-60 overflow-y-auto">
          {filteredUniversities.map((university) => (
            <button
              key={university._id}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              onClick={() => handleUniversitySelect(university.name)}
            >
              <div className="font-medium">{university.name}</div>
              <div className="text-sm text-gray-500">{university.country}</div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown &&
        search.length >= 2 &&
        filteredUniversities.length === 0 &&
        !isLoading && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow p-2 text-sm text-gray-600">
            No universities found. You can still type a custom name.
          </div>
        )}
    </div>
  );
}

interface EducationSectionProps {
  form: UseFormReturn<any>;
  educationFields: FieldArrayWithId<any, "educationList", "id">[];
  appendEducation: (value: any) => void;
  removeEducation: (index: number) => void;
}

// Utility function to compare dates (format: MM/YYYY)
const isDateValid = (startDate: string, graduationDate: string): boolean => {
  if (!startDate || !graduationDate) return true; // Skip if either date is empty
  const [startMonth, startYear] = startDate.split("/").map(Number);
  const [gradMonth, gradYear] = graduationDate.split("/").map(Number);

  if (startYear > gradYear) return false;
  if (startYear === gradYear && startMonth > gradMonth) return false;
  return true;
};

export function EducationSection({
  form,
  educationFields,
  appendEducation,
  removeEducation,
}: EducationSectionProps) {
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
          headers: {
            "Content-Type": "application/json",
          },
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
    const fetchEducationCities = async () => {
      const newCitiesData: string[][] = [];
      const newLoadingStates: boolean[] = [];

      for (let index = 0; index < educationFields.length; index++) {
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

    fetchEducationCities();
  }, [educationFields.length, selectedEducationCountries]);

  // Sync education countries state with form data
  useEffect(() => {
    setSelectedEducationCountries(
      educationFields.map(
        (field, index) => form.getValues(`educationList.${index}.country`) || ""
      )
    );
  }, [educationFields]);

  // Validate dates whenever startDate or graduationDate changes
  useEffect(() => {
    educationFields.forEach((_, index) => {
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
  }, [form, educationFields]);

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
      <div className="mb-4">
        <CardTitle>Education*</CardTitle>
      </div>
      <div className="space-y-4">
        {educationFields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`educationList.${index}.instituteName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name*</FormLabel>
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
                        value={field.value || ""} // Ensure value is empty string if undefined
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
                          <SelectItem value="Sixth Form">Sixth Form</SelectItem>
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
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name={`educationList.${index}.currentlyStudying`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked: boolean) => {
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
                <FormField
                  control={form.control}
                  name={`educationList.${index}.startDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <CustomDateInput
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            // Trigger validation for graduation date
                            const gradDate = form.getValues(
                              `educationList.${index}.graduationDate`
                            );
                            const currentlyStudying = form.getValues(
                              `educationList.${index}.currentlyStudying`
                            );
                            if (!currentlyStudying && gradDate && value) {
                              if (!isDateValid(value, gradDate)) {
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
                <FormField
                  control={form.control}
                  name={`educationList.${index}.graduationDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Graduation Date</FormLabel>
                      <FormControl>
                        <CustomDateInput
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            // Validate against start date
                            const startDate = form.getValues(
                              `educationList.${index}.startDate`
                            );
                            const currentlyStudying = form.getValues(
                              `educationList.${index}.currentlyStudying`
                            );
                            if (!currentlyStudying && startDate && value) {
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
                          disabled={form.watch(
                            `educationList.${index}.currentlyStudying`
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {educationFields.length > 1 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeEducation(index)}
              >
                Remove Education
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            appendEducation({
              instituteName: "",
              degree: "",
              fieldOfStudy: "",
              startDate: "",
              graduationDate: "",
              currentlyStudying: false,
              city: "",
              country: "",
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
