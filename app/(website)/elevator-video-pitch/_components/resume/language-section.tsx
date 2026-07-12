"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Search } from "lucide-react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import type { UseFormReturn } from "react-hook-form"

interface Language {
  _id: string
  name: string
  nativeName?: string
  direction: string
}

interface LanguageSectionProps {
  form: UseFormReturn<any>
}

export function LanguageSection({ form }: LanguageSectionProps) {
  const [languageInput, setLanguageInput] = useState("")
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>([])
  const [allLanguages, setAllLanguages] = useState<Language[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Fetch languages from API
  useEffect(() => {
    const fetchLanguages = async () => {
      setIsLoading(true)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "{{base_url}}"
        const response = await fetch(`${baseUrl}/language`)
        const data = await response.json()
        if (data.status === "success") {
          setAllLanguages(data.data)
        }
      } catch (err) {
        console.error("Error fetching languages:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLanguages()
  }, [])

  // Filter languages based on search
  useEffect(() => {
    if (languageInput.trim() && languageInput.length >= 1) {
      const currentLanguages = form.getValues("languages") || []
      const filtered = allLanguages.filter(
        (language) =>
          language.name.toLowerCase().includes(languageInput.toLowerCase()) &&
          !currentLanguages.includes(language.name),
      )
      setFilteredLanguages(filtered.slice(0, 10)) // Limit to 10 results for performance
      setShowDropdown(true)
    } else {
      setFilteredLanguages([])
      setShowDropdown(false)
    }
  }, [languageInput, allLanguages, form])

  const addLanguage = (languageName: string) => {
    const currentLanguages = form.getValues("languages") || []
    if (!currentLanguages.includes(languageName)) {
      form.setValue("languages", [...currentLanguages, languageName])
      form.trigger("languages") // Force form to re-render
    }
    setLanguageInput("")
    setShowDropdown(false)
  }

  const removeLanguage = (index: number) => {
    const currentLanguages = form.getValues("languages") || []
    const updatedLanguages = currentLanguages.filter((_, i) => i !== index)
    form.setValue("languages", updatedLanguages)
    form.trigger("languages") // Force form to re-render
  }

  const handleLanguageKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && languageInput.trim()) {
      e.preventDefault()
      addLanguage(languageInput.trim())
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLanguageInput(e.target.value)
  }

  const handleInputFocus = () => {
    if (languageInput.length >= 1) {
      setShowDropdown(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow clicks
    setTimeout(() => setShowDropdown(false), 200)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Languages</CardTitle>
        <p className="text-sm text-muted-foreground">List the languages you speak.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="languages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add Language</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search and add languages (e.g., English, Spanish, French...)"
                        value={languageInput}
                        onChange={handleInputChange}
                        onKeyPress={handleLanguageKeyPress}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="pl-10"
                      />
                    </div>

                    {/* Loading indicator */}
                    {isLoading && languageInput && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow p-2 text-sm text-gray-600">
                        Loading languages...
                      </div>
                    )}

                    {/* Dropdown */}
                    {showDropdown && filteredLanguages.length > 0 && !isLoading && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow max-h-60 overflow-y-auto">
                        {filteredLanguages.map((language) => (
                          <button
                            key={language._id}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                            onClick={() => addLanguage(language.name)}
                          >
                            <div className="font-medium">{language.name}</div>
                            {language.nativeName && <div className="text-sm text-gray-500">{language.nativeName}</div>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No results */}
                    {showDropdown && languageInput.length >= 1 && filteredLanguages.length === 0 && !isLoading && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow p-2 text-sm text-gray-600">
                        No languages found. Press Enter to add "{languageInput}" as a custom language.
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Selected Languages */}
          <div className="flex flex-wrap gap-2">
            {(form.getValues("languages") || []).map((language: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {language}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeLanguage(index)
                  }}
                  className="h-4 w-4 p-0 text-red-500 hover:text-red-700 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Helper message */}
          {!(form.getValues("languages") || []).length && (
            <p className="text-sm text-gray-500">No languages selected. Start typing to search and add languages.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
