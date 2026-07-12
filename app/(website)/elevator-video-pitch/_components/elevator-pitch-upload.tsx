"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Upload, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/company/file-upload";
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
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                src={videoUrl}
                controls
                className="w-full h-64 object-contain"
                preload="metadata"
                aria-label="Elevator pitch preview"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 min-w-0">
                <Play className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm font-medium text-blue-900 truncate">
                  {selectedFile?.name ||
                    (isUploaded ? "Uploaded Video" : "Selected Video")}
                </span>
                {selectedFile && (
                  <span className="text-xs text-blue-600 shrink-0">
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
                  className="flex items-center gap-1"
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
                  aria-label="Choose a different video file"
                >
                  Upload Different Video
                </Button>
              )}
            </div>

            {/* NOTE: The parent component should render the actual Upload button that calls the API. */}
          </div>
        ) : (
          <div className="rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            <FileUpload
              onFileSelect={handleFileSelect}
              accept="video/*"
              variant="dark"
              className="min-h-[200px]"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-blue-600/20 p-4">
                  <Upload className="h-8 w-8 text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-white mb-2">
                    Upload Your Video Pitch
                  </p>
                  <p className="text-gray-300 text-sm mb-4">
                    Drop your video here or click to browse
                  </p>
                
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0"
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
