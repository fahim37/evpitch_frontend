"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { X, Upload, RotateCw } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface LogoUploadProps {
  onFileSelect: (file: File | null) => void;
  previewUrl?: string | null;
  outputSize?: number;
  maxFileSizeMB?: number;
}

const ASPECT = 1; // Square aspect ratio
const DEFAULT_OUTPUT_SIZE = 200; // Default output size in px
const DEFAULT_MAX_FILE_SIZE_MB = 10; // Default max file size in MB

export function LogoUpload({
  onFileSelect,
  previewUrl,
  outputSize = DEFAULT_OUTPUT_SIZE,
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
}: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cleanup selectedImage URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  // Open crop modal when selectedImage is set
  useEffect(() => {
    if (selectedImage) setCropModalOpen(true);
  }, [selectedImage]);

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
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    } else {
      toast.error("Please upload a valid image file (JPG, PNG, WebP)");
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxFileSizeMB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    };
    reader.onerror = () => {
      toast.error("Failed to read the file. Please try another image.");
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.currentTarget.value = ""; // Allow re-selecting same file
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setSelectedImage(null);
    setCropModalOpen(false);
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area, rotation: number): Promise<File> => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Handle rotation
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-outputSize / 2, -outputSize / 2);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], "cropped-logo.jpg", { type: "image/jpeg" }));
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        0.92
      );
    });
  };

  const handleCropConfirm = async () => {
    if (selectedImage && croppedAreaPixels) {
      setIsProcessing(true);
      try {
        const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels, rotation);
        onFileSelect(croppedImage);
        setCropModalOpen(false);
        setSelectedImage(null);
        toast.success("Logo uploaded successfully");
      } catch (error) {
        toast.error("Failed to process image");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative w-[170px] h-[170px] rounded-lg overflow-hidden border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
          ${dragActive ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
        aria-label="Upload company logo"
      >
        {previewUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={previewUrl}
              alt="Logo preview"
              fill
              className="object-cover rounded-lg"
              draggable={false}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={removeLogo}
              className="absolute top-1 right-1 h-6 w-6"
              aria-label="Remove logo"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="w-full h-full bg-primary text-white flex flex-col items-center justify-center text-sm font-medium rounded-lg">
            <Upload className="h-6 w-6 mb-2" />
            Company Logo
            <div className="text-xs mt-1">JPG/PNG • up to {maxFileSizeMB}MB</div>
          </div>
        )}
        <input
          ref={fileInputRef}
          id="logo-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <Dialog
        open={cropModalOpen}
        onOpenChange={(open) => {
          setCropModalOpen(open);
          if (!open) {
            setSelectedImage(null);
            setZoom(1);
            setRotation(0);
            setCrop({ x: 0, y: 0 });
            setCroppedAreaPixels(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crop Company Logo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative h-[300px] bg-black rounded-md overflow-hidden">
              {selectedImage && (
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={ASPECT}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  restrictPosition={false}
                  minZoom={0.5}
                  maxZoom={3}
                  showGrid
                />
              )}
              <div className="absolute left-3 top-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
                Drag to reposition • Zoom/Rotate below
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label htmlFor="zoom" className="w-20 text-sm">
                  Zoom
                </label>
                <input
                  id="zoom"
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                  aria-label="Zoom"
                />
                <div className="w-12 text-right text-xs">{zoom.toFixed(2)}x</div>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="rotate" className="w-20 text-sm">
                  Rotate
                </label>
                <input
                  id="rotate"
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full"
                  aria-label="Rotate"
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
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCropModalOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCropConfirm}
                disabled={isProcessing || !croppedAreaPixels}
              >
                {isProcessing ? "Processing..." : "Confirm Crop"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}