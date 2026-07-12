"use client"

import { useState } from "react"
import { BannerUpload } from "./banner-upload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function BannerUploadDemo() {
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (file: File | null) => {
    setBannerFile(file)
    if (file) {
      // Create a preview URL from the cropped file
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleDownload = () => {
    if (bannerFile) {
      const url = URL.createObjectURL(bannerFile)
      const a = document.createElement("a")
      a.href = url
      a.download = bannerFile.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      <BannerUpload onFileSelect={handleFileSelect} previewUrl={previewUrl} />

      {bannerFile && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">File Name</p>
                <p className="font-medium">{bannerFile.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">File Size</p>
                <p className="font-medium">{(bannerFile.size / 1024).toFixed(2)} KB</p>
              </div>
              <div>
                <p className="text-muted-foreground">File Type</p>
                <p className="font-medium">{bannerFile.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dimensions</p>
                <p className="font-medium">300px height (5:1 ratio)</p>
              </div>
            </div>
            <Button onClick={handleDownload} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Cropped Banner
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
