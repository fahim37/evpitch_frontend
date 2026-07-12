"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Lock, Calendar, LogOut, Camera, Menu, Edit2 } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Cropper, { type Area } from "react-easy-crop";

async function fetchUserData(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

async function updateAvatar({ token, file }: { token: string; file: File }) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/update`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update avatar");
  }
  return response.json();
}

export function ProfileSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const token = session?.accessToken || "";
  const role = session?.user?.role as string | undefined;

  const [isOpen, setIsOpen] = useState(false); // Mobile sheet
  const [confirmOpen, setConfirmOpen] = useState(false); // Crop dialog state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // Added for rotation control
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup for URL.createObjectURL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (selectedImage) URL.revokeObjectURL(selectedImage);
    };
  }, [previewUrl, selectedImage]);

  // Fetch user data
  const { data: userData, isLoading: isUserDataLoading } = useQuery({
    queryKey: ["userData", token],
    queryFn: () => fetchUserData(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation for updating avatar
  const avatarMutation = useMutation({
    mutationFn: updateAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData", token] });
      toast.success("Avatar updated successfully!");
      setConfirmOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: any) => {
      toast.error(`Failed to update avatar: ${error.message}`);
      setIsProcessing(false);
    },
  });

  // Define menu items
  const menuItems = useMemo(
    () =>
      [
        { href: "/account", label: "Personal Information", icon: User },
        {
          href: "/account/change-password",
          label: "Change Password",
          icon: Lock,
        },
        { href: "/account/job-history", label: "Job History", icon: Calendar },
        {
          href: "/account/payment-history",
          label: "Payment History",
          icon: Lock,
        },
      ].filter(
        (item) =>
          !(
            (role === "recruiter" || role === "company") &&
            item.href === "/account/job-history"
          )
      ),
    [role]
  );

  // Cropping logic
  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<File> => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const outputSize = 200;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Apply rotation
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

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], "cropped-avatar.jpg", { type: "image/jpeg" }));
        }
      }, "image/jpeg");
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setConfirmOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const confirmUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      setSelectedFile(croppedImage);
      setPreviewUrl(URL.createObjectURL(croppedImage));
      avatarMutation.mutate({ token, file: croppedImage });
    } catch (error) {
      toast.error("Failed to process image");
      setIsProcessing(false);
    }
  };

  const cancelUpload = () => {
    setConfirmOpen(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (selectedImage) URL.revokeObjectURL(selectedImage);
    setPreviewUrl(null);
    setSelectedFile(null);
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle loading state with skeleton loader
  if (status === "loading" || isUserDataLoading) {
    return (
      <div className="hidden xl:block w-72 2xl:w-80 bg-white min-h-screen p-6 border-r border-gray-100">
        <div className="animate-pulse">
          <div className="flex flex-col items-center mb-8">
            <div className="h-24 w-24 bg-gray-200 rounded-full mb-4" />
            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-40" />
          </div>
          <div className="space-y-2 px-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-100 mt-16">
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center mb-6 p-6">
        <div className="relative mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={
                userData?.data?.avatar?.url || "https://via.placeholder.com/150"
              }
              alt={session?.user?.name || "User Avatar"}
            />
            <AvatarFallback className="text-xl bg-gray-200">
              {userData?.data?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleAvatarClick}
            className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
            aria-label="Upload new avatar"
            disabled={avatarMutation.isPending}
          >
            <Camera className="h-4 w-4 text-white" aria-hidden="true" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            aria-hidden="true"
          />
        </div>
        <h3 className="font-semibold text-lg sm:text-xl text-gray-900 text-center">
          {userData?.data.name || "User"}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 text-center break-all">
          {userData?.data.email || "No email provided"}
        </p>
      </div>

      <nav className="flex-1 px-3 sm:px-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 sm:px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 sm:p-6 border-t border-gray-100 mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-medium"
          onClick={() => {
            setIsOpen(false);
            signOut({ callbackUrl: "/login" });
          }}
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Log out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: sticky trigger for easy access */}
      <div className="lg:hidden sticky top-16 z-30 px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-[#2B7FD0] text-white shadow-md hover:shadow-lg hover:bg-[#2b80d0]/80"
              aria-label="Open profile menu"
            >
              <span className="font-medium">Profile</span>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] sm:w-80 p-0 bg-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-semibold">
                Profile Menu
              </h2>
            </div>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 xl:w-72 2xl:w-80 bg-white border-r border-gray-100">
        <SidebarContent />
      </div>

      {/* Crop avatar dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => (o ? setConfirmOpen(true) : cancelUpload())}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crop Profile Photo</DialogTitle>
            <DialogDescription>
              Adjust the crop area for your profile picture, then confirm to upload.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative h-[300px] bg-black rounded-md overflow-hidden">
              {selectedImage && (
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  restrictPosition={false}
                  minZoom={0.5}
                  maxZoom={3}
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
                variant="outline"
                onClick={cancelUpload}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button onClick={confirmUpload} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Confirm Crop"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}