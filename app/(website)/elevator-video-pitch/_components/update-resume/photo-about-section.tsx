"use client"

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { UseFormReturn } from "react-hook-form"
import { PhotoUpload } from "./photo-upload"
import { Textarea } from "@/components/ui/textarea"

const ABOUT_MIN_WORDS = 1
const ABOUT_MAX_WORDS = 200

const getWordCount = (value?: string | null) => {
  const text = value?.trim() ?? ""
  return text ? text.split(/\s+/).length : 0
}

interface PhotoAboutSectionProps {
  form: UseFormReturn<any>
  photoPreview: string | null
  onPhotoSelect: (file: File | null) => void
}

export function PhotoAboutSection({ form, photoPreview, onPhotoSelect }: PhotoAboutSectionProps) {
  return (
    <div className="w-full">
      <div className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
          {/* Photo Section */}
          <div className="flex-shrink-0 w-full md:w-auto ">
            <FormLabel className="text-sm font-medium text-blue-600 mb-2 block">
              Profile Photo
            </FormLabel>
            <div className="flex justify-center md:justify-start">
              <PhotoUpload onFileSelect={onPhotoSelect} previewUrl={photoPreview} />
            </div>
          </div>

          {/* About Me Section */}
          <div className="flex-1 w-full">
            <FormField
              control={form.control}
              name="aboutUs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-600 font-medium">About Me</FormLabel>
                  <FormControl>
                    <div className="mt-2">
                      <Textarea value={field.value ?? ""} onChange={field.onChange} />
                    </div>
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
  )
}
