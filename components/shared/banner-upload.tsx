"use client";
import React, { useCallback, useRef, useState, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, ImageIcon, RotateCw, Edit2, Trash2 } from "lucide-react";
import getCroppedImg from "@/hooks/cropImage";

interface BannerUploadProps {
  onFileSelect: (file: File | null) => void;
  previewUrl?: string | null;
}

// ✅ LinkedIn cover photo ratio — 1584×396 px = 4:1 aspect ratio
const COVER_ASPECT = 4 / 1;
const OUTPUT_HEIGHT = 396;

export function BannerUpload({ onFileSelect, previewUrl }: BannerUploadProps) {
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
    e.currentTarget.value = "";
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
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      alert("Failed to read the file. Please try another image.");
    };
    reader.readAsDataURL(file);
  };

  const removeBanner = () => onFileSelect(null);

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
        OUTPUT_HEIGHT,
        "image/jpeg",
        0.92
      );
      const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
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
        <div>
          {previewUrl ? (
            <div className="relative">
              {/* ✅ LinkedIn ratio preview */}
              <div className="relative w-full h-auto rounded-lg overflow-hidden border">
                <img
                  src={previewUrl}
                  alt="Banner preview"
                  className="w-full h-auto object-cover"
                />
              </div>

              <div className="absolute top-2 right-2 flex gap-2">
                {/* Change / Replace button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="p-2 rounded-md bg-white/80 backdrop-blur-sm hover:bg-white"
                  aria-label="Change banner"
                  title="Change"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={removeBanner}
                  className="p-2 rounded-md bg-white/80 backdrop-blur-sm hover:bg-white"
                  aria-label="Remove banner"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4 " />
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <div className="text-gray-600 mb-3">
                Drop your banner image here
              </div>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                type="button"
              >
                Choose Image
              </Button>
              <div className="text-xs text-gray-500 mt-3">
                Supports JPG, PNG • Max 10MB • Cropped to 1584×396 px
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={onInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Cropper Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Edit Cover Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative h-[420px] bg-black rounded-md overflow-hidden">
              {sourceImage && (
                <Cropper
                  image={sourceImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={COVER_ASPECT}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  showGrid
                  minZoom={1}
                  maxZoom={3}
                />
              )}
              <div className="absolute left-3 top-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
                Focus main content in the center — LinkedIn crops edges
              </div>
            </div>

            {/* Zoom + Rotation Controls */}
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
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCropModalOpen(false);
                  onFileSelect(null);
                  setSourceImage(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={confirmCrop}>Confirm Crop</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
