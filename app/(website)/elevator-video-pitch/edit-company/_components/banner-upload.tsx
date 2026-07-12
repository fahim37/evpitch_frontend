"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"
import Cropper, { type Area } from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface BannerUploadProps {
  onFileSelect: (file: File | null) => void
  previewUrl?: string | null
}

export function BannerUpload({ onFileSelect, previewUrl }: BannerUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const removeBanner = () => {
    onFileSelect(null)
    setSelectedImage(null)
    setCropModalOpen(false)
  }

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<File> => {
    const image = new window.Image()
    image.src = imageSrc
    await new Promise((resolve) => (image.onload = resolve))

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    const outputHeight = 300
    const scale = outputHeight / pixelCrop.height
    const outputWidth = pixelCrop.width * scale

    canvas.width = outputWidth
    canvas.height = outputHeight

    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outputWidth, outputHeight)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], "cropped-banner.jpg", { type: "image/jpeg" }))
        }
      }, "image/jpeg")
    })
  }

  const handleCropConfirm = async () => {
    if (selectedImage && croppedAreaPixels) {
      setIsProcessing(true)
      try {
        const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels)
        onFileSelect(croppedImage)
        setCropModalOpen(false)
        setSelectedImage(null)
      } catch (error) {
        toast.error("Failed to process image")
      } finally {
        setIsProcessing(false)
      }
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle>Upload Banner</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Upload and crop a banner image to enhance your resume profile.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {previewUrl ? (
            <div className="relative">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <Image
                  src={previewUrl}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                  onError={() => console.error("Invalid banner image URL")} // Debug invalid URLs
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeBanner}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              htmlFor="banner-upload"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Drop your banner image here</p>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => e.preventDefault()} // Prevent button click from triggering label
              >
                Choose Image
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Supports JPG, PNG • Max 10MB • Will be cropped to 300px height
              </p>
            </label>
          )}
          <input id="banner-upload" type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
        </CardContent>
      </Card>

      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Crop Banner Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-[400px] bg-black">
            {selectedImage && (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={5 / 1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={false}
                minZoom={0.5}
                maxZoom={3}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCropModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Confirm Crop"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
