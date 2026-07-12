"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Trash2, Edit2 } from "lucide-react";
import getCroppedImg from "@/hooks/cropImage";
import Image from "next/image";

interface PhotoUploadProps {
  onFileSelect: (file: File | null) => void;
  previewUrl?: string | null;
}

const OUTPUT_SIZE = 250; // final square size in px
const ASPECT = 1; // square

export function PhotoUpload({ onFileSelect, previewUrl }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (sourceImage) setCropModalOpen(true);
  }, [sourceImage]);

  // Prevent parent form submit when interacting (mouse & keyboard)
  const openFileDialog = (e?: React.SyntheticEvent | KeyboardEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    fileInputRef.current?.click();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) startCropFlow(f);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) startCropFlow(f);
    // allow re-selecting same file later
    e.currentTarget.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // support Enter/Space to open file dialog but prevent form submit
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      fileInputRef.current?.click();
    }
  };

  const startCropFlow = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      alert("Failed to read the file. Please try another image.");
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    onFileSelect(null);
    setSourceImage(null);
    setCropModalOpen(false);
  };

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const confirmCrop = useCallback(async () => {
    if (!sourceImage || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(
        sourceImage,
        croppedAreaPixels as Area,
        rotation,
        OUTPUT_SIZE, // final output size (square)
        "image/jpeg",
        0.92
      );
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      onFileSelect(file);
      setCropModalOpen(false);
      setSourceImage(null);
      setZoom(1);
      setRotation(0);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    } catch (e) {
      console.error("Crop failed:", e);
      alert("Failed to crop image. Try another image.");
    }
  }, [sourceImage, croppedAreaPixels, rotation, onFileSelect]);

  return (
    <>
      <div>
        <div className="h-[250px] w-[250px]">
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => openFileDialog(e)}
            onKeyDown={handleKeyDown}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative w-full h-[250px] md:h-[250px] rounded-lg overflow-hidden border transition-colors focus:outline-none
              ${
                dragActive
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }
              flex items-center justify-center cursor-pointer`}
            aria-label="Upload profile photo"
          >
            {previewUrl ? (
              <>
                <div className="absolute inset-0">
                  <Image
                    src={previewUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                    width={800}
                    height={800}
                    draggable={false}
                  />
                </div>

                {/* subtle controls (icons only) */}
                <div className="absolute right-3 top-3 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileDialog(e);
                    }}
                    className="p-2 rounded-md bg-white/80 backdrop-blur-sm hover:bg-white"
                    aria-label="Change photo"
                    title="Change"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={removePhoto}
                    className="p-2 rounded-md bg-white/80 backdrop-blur-sm hover:bg-white"
                    aria-label="Remove photo"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* hover hint */}
                <div className="pointer-events-none absolute left-3 bottom-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
                  Click to change
                </div>
              </>
            ) : (
              <div className="text-center select-none px-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Upload className="h-7 w-7 text-gray-500" />
                </div>
                <div className="font-medium text-gray-700">
                  Click to add photo
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  JPG/PNG • up to 10MB • cropped to 250×250
                </div>
              </div>
            )}
          </div>

          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onInputChange}
            className="hidden"
            // prevent form submission if input gets focused + Enter
            onClick={(e) => {
              // stop propagation of native events that might bubble up to a form
              e.stopPropagation();
            }}
          />
        </div>
      </div>

      {/* Cropper Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative h-[420px] bg-black rounded-md overflow-hidden">
              {sourceImage && (
                <Cropper
                  image={sourceImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={ASPECT}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  showGrid
                  minZoom={1}
                  maxZoom={3}
                  restrictPosition={false}
                />
              )}
              <div className="absolute left-3 top-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
                Drag to reposition • Zoom/Rotate below
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className="w-20 text-sm">Zoom</label>
                <input
                  aria-label="Zoom"
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
                <div className="w-12 text-right text-xs">
                  {zoom.toFixed(2)}x
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="w-20 text-sm">Rotate</label>
                <input
                  aria-label="Rotate"
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="ml-2 p-2 rounded border"
                  title="Rotate 90°"
                  aria-label="Rotate 90 degrees"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCropModalOpen(false);
                  setSourceImage(null);
                  onFileSelect(null);
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={confirmCrop}>
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}