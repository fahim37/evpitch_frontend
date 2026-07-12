"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";
// Assuming you have the Sonner package installed and a Toaster component set up in your layout
import { toast } from "sonner"; // 👈 New import for toast
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


const MAX_FILE_SIZE_BYTES = 600 * 1024 * 1024; 

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "dark";
  defaultUrl?: string;
}

export function FileUpload({
  onFileSelect,
  accept = "*/*",
  maxSize = MAX_FILE_SIZE_BYTES,
  className,
  children,
  variant = "default",
  defaultUrl,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaultUrl || null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (defaultUrl) {
      setPreviewUrl(defaultUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile, defaultUrl]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      // 👈 Changed from alert to toast.error
      toast.error(`File size must be less than ${maxSize / 1024 / 1024}MB`, {
        description: `The file "${file.name}" is too large.`,
        duration: 5000,
      });
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
    // Optional: Show success toast
    // toast.success(`File "${file.name}" selected successfully.`);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const renderPreview = () => {
    if (previewUrl) {
      // check if it's from selectedFile (with type info) or just defaultUrl
      if (
        selectedFile?.type?.startsWith("image/") ||
        (!selectedFile && previewUrl)
      ) {
        return (
          <div className="relative w-full h-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <RemoveBtn />
          </div>
        );
      }
      if (selectedFile?.type?.startsWith("video/")) {
        return (
          <div className="relative w-full h-full">
            <video
              src={previewUrl}
              controls
              className="w-full h-full object-cover rounded-lg"
            />
            <RemoveBtn />
          </div>
        );
      }
    }

    return (
      children || (
        <div>
          <Upload
            className={cn(
              "mx-auto h-12 w-12 mb-4",
              variant === "dark" ? "text-gray-300" : "text-gray-400"
            )}
          />
          <p
            className={cn(
              "mb-2",
              variant === "dark" ? "text-gray-300" : "text-gray-600"
            )}
          >
            Drop your files here
          </p>
          <Button
            type="button"
            variant={variant === "dark" ? "secondary" : "outline"}
          >
            Choose File
          </Button>
        </div>
      )
    );
  };

  const RemoveBtn = () => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={removeFile}
      className={cn(
        "absolute top-2 right-2 rounded-full",
        variant === "dark"
          ? "bg-gray-800/80 text-red-400 hover:text-red-300"
          : "bg-white/80 text-red-500 hover:text-red-700"
      )}
    >
      <X className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-2 text-center cursor-pointer transition-colors h-full flex items-center justify-center",
          variant === "dark"
            ? "border-gray-600 hover:border-gray-500 bg-gray-800/50"
            : "border-gray-300 hover:border-gray-400",
          dragActive &&
            (variant === "dark"
              ? "border-blue-400 bg-gray-700"
              : "border-blue-500 bg-blue-50")
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        {renderPreview()}
      </div>
    </div>
  );
}
