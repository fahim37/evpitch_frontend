"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Upload, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/company/file-upload";
import { VideoPlayer } from "@/components/company/video-player";
import { useEffect, useMemo, useState } from "react";

interface ElevatorPitchUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  uploadedVideoUrl?: string | null; // server URL after successful API upload
  onDelete?: () => void; // parent triggers API delete
  isUploaded?: boolean; // true only AFTER API upload succeeds
}

export function ElevatorPitchUpload({
  onFileSelect,
  selectedFile,
  uploadedVideoUrl,
  onDelete,
  isUploaded = false,
}: ElevatorPitchUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Prefer the server URL when present; otherwise use local preview
  const videoUrl = useMemo(
    () => uploadedVideoUrl || previewUrl,
    [uploadedVideoUrl, previewUrl]
  );

  const handleFileSelect = (file: File | null) => {
    // If a new local file is picked while not uploaded yet, create an object URL
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
    } else {
      // Clear local preview
      if (previewUrl && previewUrl.startsWith("blob:"))
        URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onFileSelect(file);
  };

  const handleDelete = () => {
    // Always clear local preview
    if (previewUrl && previewUrl.startsWith("blob:"))
      URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onFileSelect(null);

    // Only call API delete if we actually have an uploaded video
    if (isUploaded && onDelete) {
      onDelete();
    }
  };

  // Cleanup any blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div>
      <div>
        {videoUrl ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            <VideoPlayer
              src={videoUrl}
              autoPlay={false}
              poster=""
              title={isUploaded ? "Your elevator pitch" : "Pitch preview"}
              className="max-w-3xl"
            />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-lg border border-[#2B7FD0]/20 bg-[#2B7FD0]/[0.05] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2B7FD0]/10">
                  <Play className="h-4 w-4 text-[#2B7FD0]" />
                </div>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile?.name ||
                    (isUploaded ? "Uploaded Video" : "Selected Video")}
                </span>
                {selectedFile && (
                  <span className="text-xs text-gray-500 shrink-0">
                    ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                )}
              </div>

              {/* After successful API upload: show Delete only */}
              {isUploaded ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="flex items-center gap-1 w-full sm:w-auto"
                  aria-label="Delete uploaded video"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              ) : (
                // Before upload: allow changing the local file; no Delete shown
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileSelect(null)}
                  className="w-full sm:w-auto border-[#2B7FD0]/40 text-[#2B7FD0] hover:bg-[#2B7FD0]/5 hover:text-[#2B7FD0]"
                  aria-label="Choose a different video file"
                >
                  Upload Different Video
                </Button>
              )}
            </div>

            {/* NOTE: The parent component should render the actual Upload button that calls the API. */}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <FileUpload
              onFileSelect={handleFileSelect}
              accept="video/*"
              variant="brand"
              className="min-h-[220px] sm:min-h-[260px]"
            >
              <div className="flex flex-col items-center justify-center space-y-4 px-4 py-8 sm:py-10">
                <div className="rounded-full bg-[#2B7FD0]/10 p-4">
                  <Upload className="h-7 w-7 sm:h-8 sm:w-8 text-[#2B7FD0]" />
                </div>
                <div className="text-center">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                    Upload Your Video Pitch
                  </p>
                  <p className="text-gray-500 text-sm">
                    Drop your video here or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    MP4, MOV or WebM &middot; up to 600MB
                  </p>
                </div>
                <Button
                  type="button"
                  className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white rounded-full px-6"
                >
                  Choose Video File
                </Button>
              </div>
            </FileUpload>
          </div>
        )}
      </div>
    </div>
  );
}
