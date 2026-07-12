"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronsUpDown } from "lucide-react"

interface Country {
  country: string
  cities: string[]
}

interface JobCategory {
  _id: string
  name: string
  role: string[]
  categoryIcon: string
}

interface CurrencyApiItem {
  _id: string
  code: string
  currencyName: string
  symbol?: string
}

interface JobDetailsPreviewEditProps {
  formData: any
  onFieldChange: (field: string, value: string) => void
  jobCategories: JobCategory[]
  countries: Country[]
  cities: string[]
  currencies: CurrencyApiItem[]
  selectedCountry: string
  onCountryChange: (country: string) => void
  isLoadingCountries: boolean
  isLoadingCities: boolean
  isLoadingCurrencies: boolean
}

export default function JobDetailsPreviewEdit({
  formData,
  onFieldChange,
  jobCategories,
  countries,
  cities,
  currencies,
  selectedCountry,
  onCountryChange,
  isLoadingCountries,
  isLoadingCities,
  isLoadingCurrencies,
}: JobDetailsPreviewEditProps) {
  const [openCountry, setOpenCountry] = useState(false)
  const [openCity, setOpenCity] = useState(false)
  const [openCategory, setOpenCategory] = useState(false)
  const [openRole, setOpenRole] = useState(false)
  const [openCurrency, setOpenCurrency] = useState(false)
  const [selectedCategoryRoles, setSelectedCategoryRoles] = useState<string[]>([])

  // keep roles in sync if categoryId already present (e.g., on edit)
  useEffect(() => {
    if (!formData?.categoryId) {
      setSelectedCategoryRoles([])
      return
    }
    const cat = jobCategories.find((c) => c._id === formData.categoryId)
    setSelectedCategoryRoles(cat?.role || [])
  }, [formData?.categoryId, jobCategories])

  const handleCategorySelect = (categoryId: string) => {
    const category = jobCategories.find((c) => c._id === categoryId)
    onFieldChange("categoryId", categoryId)
    onFieldChange("category", category?.name || "")
    // reset role on category change
    onFieldChange("role", "")
    setSelectedCategoryRoles(category?.role || [])
    setOpenCategory(false)
  }

  const handleRoleSelect = (role: string) => {
    onFieldChange("role", role)
    // auto-fill Job Title only if empty
    if (!formData.jobTitle) {
      onFieldChange("jobTitle", role)
    }
    setOpenRole(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Job Category</label>
          <Popover open={openCategory} onOpenChange={setOpenCategory}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="h-11 justify-between w-full bg-transparent">
                {formData.category || "Select category"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandList>
                  <CommandEmpty>No category found.</CommandEmpty>
                  <CommandGroup>
                    {jobCategories.map((category) => (
                      <CommandItem
                        key={category._id}
                        value={category.name}
                        onSelect={() => handleCategorySelect(category._id)}
                      >
                        {category.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Role</label>
          <Popover open={openRole} onOpenChange={setOpenRole}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="h-11 justify-between w-full bg-transparent"
                disabled={!selectedCategoryRoles.length}
              >
                {formData.role || "Select role"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search role..." />
                <CommandList>
                  <CommandEmpty>
                    {selectedCategoryRoles.length === 0 ? "Select a category first" : "No role found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {selectedCategoryRoles.map((role) => (
                      <CommandItem
                        key={role}
                        value={role}
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
        </div>
      </div>

      {/* Job Title — only show after role is selected */}
      {formData.role && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Job Title</label>
          <Input
            value={formData.jobTitle}
            onChange={(e) => onFieldChange("jobTitle", e.target.value)}
            placeholder="Enter job title"
            className="h-11"
          />
        </div>
      )}

      {/* Department */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Department</label>
        <Input
          value={formData.department}
          onChange={(e) => onFieldChange("department", e.target.value)}
          placeholder="Enter department"
          className="h-11"
        />
      </div>

      {/* Country & City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Country</label>
          <Popover open={openCountry} onOpenChange={setOpenCountry}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="h-11 justify-between w-full bg-transparent">
                {formData.country || "Select country"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search country..." />
                <CommandList>
                  <CommandEmpty>{isLoadingCountries ? "Loading..." : "No country found."}</CommandEmpty>
                  <CommandGroup>
                    {countries.map((country) => (
                      <CommandItem
                        key={country.country}
                        value={country.country}
                        onSelect={() => {
                          onFieldChange("country", country.country)
                          onCountryChange(country.country)
                          onFieldChange("region", "")
                          setOpenCountry(false)
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
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">City</label>
          <Popover open={openCity} onOpenChange={setOpenCity}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="h-11 justify-between w-full bg-transparent"
                disabled={!selectedCountry || isLoadingCities}
              >
                {formData.region || (isLoadingCities ? "Loading..." : "Select city")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search city..." />
                <CommandList>
                  <CommandEmpty>No city found.</CommandEmpty>
                  <CommandGroup>
                    {cities.map((city) => (
                      <CommandItem
                        key={city}
                        value={city}
                        onSelect={() => {
                          onFieldChange("region", city)
                          setOpenCity(false)
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
        </div>
      </div>

      {/* Vacancy */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Number of Vacancies</label>
        <Input
          type="number"
          value={formData.vacancy || 1}
          onChange={(e) => onFieldChange("vacancy", e.target.value)}
          min="1"
          max="50"
          className="h-11"
        />
      </div>

      {/* Employment Type & Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Employment Type</label>
          <Select value={formData.employmentType} onValueChange={(value) => onFieldChange("employmentType", value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
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
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Experience Level</label>
          <Select value={formData.experience} onValueChange={(value) => onFieldChange("experience", value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior Level</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location Type & Career Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Location Type</label>
          <Select value={formData.locationType} onValueChange={(value) => onFieldChange("locationType", value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select location type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Career Stage</label>
          <Select value={formData.careerStage} onValueChange={(value) => onFieldChange("careerStage", value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select career stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New Entry">New Entry</SelectItem>
              <SelectItem value="Experienced Professional">Experienced Professional</SelectItem>
              <SelectItem value="Career Returner">Career Returner</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Compensation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Currency</label>
          <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="h-11 justify-between w-full bg-transparent">
                {formData.compensationCurrency || "Select currency"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search currency..." />
                <CommandList>
                  <CommandEmpty>{isLoadingCurrencies ? "Loading..." : "No currency found."}</CommandEmpty>
                  <CommandGroup>
                    {currencies.map((currency) => (
                      <CommandItem
                        key={currency.code}
                        value={currency.code}
                        onSelect={() => {
                          onFieldChange("compensationCurrency", currency.code)
                          setOpenCurrency(false)
                        }}
                      >
                        {currency.currencyName} ({currency.code}) {currency.symbol || ""}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Compensation Amount</label>
          <Input
            type="number"
            value={formData.compensation || ""}
            onChange={(e) => onFieldChange("compensation", e.target.value)}
            placeholder="e.g., 50000"
            className="h-11"
          />
        </div>
      </div>

      {/* Expiration Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Job Posting Expiration (Days)</label>
        <Select value={formData.expirationDate} onValueChange={(value) => onFieldChange("expirationDate", value)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select expiration period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="60">60 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Company URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Company Website</label>
        <Input
          value={formData.companyUrl}
          onChange={(e) => onFieldChange("companyUrl", e.target.value)}
          placeholder="https://example.com"
          className="h-11"
        />
      </div>
    </div>
  )
}
