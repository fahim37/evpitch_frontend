"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Eye, EyeOff } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { ChangeEmailModal } from "./ChangeEmailModal";

/* ----------------------------- API helpers ----------------------------- */

async function fetchUserData(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error("Failed to fetch user data");
  return response.json();
}

async function updateUserData({ token, data }: { token: string; data: any }) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/update`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) throw new Error("Failed to update user data");
  return response.json();
}

async function deleteAccount(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/deactivate`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) throw new Error("Failed to delete account");

  return response.json();
}

async function disableAccount(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/disable`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) throw new Error("Failed to disable account");

  return response.json();
}

/** Verify password before deletion/disable */
async function verifyPassword(email: string, password: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );
  if (!response.ok) throw new Error("Please check your password.");
  const json = await response.json();
  return json; // expects shape with { success: boolean, ... }
}

type PostingUsage = {
  paywallEnabled?: boolean;
  allowed?: boolean;
  usage?: {
    monthlyLimit?: number;
    monthlyUsed?: number;
    monthlyRemaining?: number;
    annualLimit?: number;
    annualUsed?: number;
    annualRemaining?: number;
  };
  plan?: {
    title?: string;
    valid?: string;
    for?: string;
  };
};

async function fetchPostingUsage(token: string): Promise<PostingUsage | null> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/posting/usage`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error("Failed to fetch posting usage");
  const json = await response.json();
  return json?.data ?? null;
}

/* ----------------------------- Utilities ------------------------------ */

function splitName(full?: string): { firstName: string; surname: string } {
  const safe = (full || "").trim().replace(/\s+/g, " ");
  if (!safe) return { firstName: "", surname: "" };
  const parts = safe.split(" ");
  if (parts.length === 1) return { firstName: parts[0], surname: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    surname: parts.slice(-1)[0],
  };
}

function mergeName(firstName: string, surname: string): string {
  return [firstName?.trim(), surname?.trim()].filter(Boolean).join(" ");
}

/* ------------------------- Component starts here ------------------------ */

export function PersonalInformation() {
  const [isEditing, setIsEditing] = useState(false);

  // delete modal asks for password
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // disable modal asks for password
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const { data: session } = useSession();
  const token = session?.accessToken || "";
  const role = session?.user?.role || "";

  const email = session?.user?.email || "";

  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch user data
  const { data, isLoading, error } = useQuery({
    queryKey: ["userData", token],
    queryFn: () => fetchUserData(token),
    enabled: !!token,
  });

  const { data: postingUsage } = useQuery({
    queryKey: ["postingUsage", token],
    queryFn: () => fetchPostingUsage(token),
    enabled: !!token && (role === "company" || role === "recruiter"),
  });

  // Controlled form state (split name into first/surname)
  const initialNames = useMemo(
    () => splitName(data?.data?.name),
    [data?.data?.name]
  );

  const [formData, setFormData] = useState({
    firstName: initialNames.firstName || "",
    surname: initialNames.surname || "",
    email: data?.data?.email || "",
    country: data?.data?.address || "",
    cityState: "",
    town: "",
    zipCode: "",
  });

  useEffect(() => {
    if (data?.data) {
      const split = splitName(data.data.name);
      setFormData({
        firstName: split.firstName,
        surname: split.surname,
        email: data.data.email || "",
        country: data.data.address || "",
        cityState: "",
        town: "",
        zipCode: "",
      });
    }
  }, [data]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateUserData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData", token] });
      toast.success("Personal information updated successfully!");
      setIsEditing(false);
    },
    onError: (error: any) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteFlowMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const verify = await verifyPassword(email, password);
      if (!verify?.success) {
        throw new Error("Password verification failed");
      }
      return await deleteAccount(token);
    },
    onSuccess: async () => {
      toast.success(
        "Your account is now marked for deletion. You can still log in within 30 days to restore it.",
        { duration: 4000 }
      );
      setIsDeleteModalOpen(false);
      setDeletePassword("");

      try {
        // client-side signOut: no hard redirect
        const res: any = await signOut({
          redirect: false,
          callbackUrl: "/",
        });

        // give the user a beat to read the toast
        await new Promise((r) => setTimeout(r, 1000));

        // SPA navigation keeps Toaster mounted
        router.replace(res?.url ?? "/");
      } catch (error) {
        toast.error("Failed to log out: " + (error as Error).message);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Account deletion failed");
    },
  });

  const disableFlowMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const verify = await verifyPassword(email, password);
      if (!verify?.success) {
        throw new Error("Password verification failed");
      }
      return await disableAccount(token);
    },
    onSuccess: async () => {
      toast.success(
        "Your account has been deactivated. You can re-enable it later by logging in with your email and password.",
        { duration: 4000 }
      );
      setIsDisableModalOpen(false);
      setDisablePassword("");

      try {
        const res: any = await signOut({
          redirect: false,
          callbackUrl: "/",
        });

        await new Promise((r) => setTimeout(r, 1000));
        router.replace(res?.url ?? "/");
      } catch (error) {
        toast.error("Failed to log out: " + (error as Error).message);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Account disable failed");
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const mergedName = mergeName(formData.firstName, formData.surname);
    updateMutation.mutate({
      token,
      data: {
        name: mergedName,
        address: formData.country,
      },
    });
  };

  const handleDelete = () => setIsDeleteModalOpen(true);
  const handleDisable = () => setIsDisableModalOpen(true);

  const confirmDelete = () => {
    if (!email) {
      toast.error("No email found in session. Please log in again and try.");
      return;
    }
    if (!deletePassword) {
      toast.error("Please enter your password to continue.");
      return;
    }
    deleteFlowMutation.mutate({ email, password: deletePassword });
  };

  const confirmDisable = () => {
    if (!email) {
      toast.error("No email found in session. Please log in again and try.");
      return;
    }
    if (!disablePassword) {
      toast.error("Please enter your password to continue.");
      return;
    }
    disableFlowMutation.mutate({ email, password: disablePassword });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-10 w-24 bg-gray-200 rounded" />
        </div>
        {/* Form Fields Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(7)].map((_, index) => (
            <div key={index}>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        {/* Buttons Skeleton */}
        <div className="flex gap-4 mt-12 pt-8 border-t border-gray-200">
          <div className="h-10 w-32 bg-gray-200 rounded" />
          <div className="flex-1">
            <div className="h-10 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-64 bg-gray-200 rounded mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div>Error: {(error as Error).message}</div>;

  const monthlyLimit = postingUsage?.usage?.monthlyLimit;
  const monthlyUsed = postingUsage?.usage?.monthlyUsed;
  const monthlyRemaining = postingUsage?.usage?.monthlyRemaining;
  const annualLimit = postingUsage?.usage?.annualLimit;
  const annualUsed = postingUsage?.usage?.annualUsed;
  const annualRemaining = postingUsage?.usage?.annualRemaining;
  const planLabel = postingUsage?.plan?.title || postingUsage?.plan?.valid;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Personal Information
        </h1>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-primary hover:bg-blue-700 text-white px-4 py-2 text-sm"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      {/* {postingUsage && (role === "company" || role === "recruiter") && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm text-blue-700 font-medium">Plan</p>
            <p className="text-lg font-semibold text-blue-900">
              {planLabel || "Current plan"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600 font-medium">Jobs this month</p>
            <p className="text-lg font-semibold text-gray-900">
              {monthlyUsed ?? "—"} / {monthlyLimit ?? "auto"}
            </p>
            <p className="text-xs text-gray-500">
              Remaining: {monthlyRemaining ?? "auto"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600 font-medium">Jobs this year</p>
            <p className="text-lg font-semibold text-gray-900">
              {annualUsed ?? "—"} / {annualLimit ?? "auto"}
            </p>
            <p className="text-xs text-gray-500">
              Remaining: {annualRemaining ?? "auto"}
            </p>
          </div>
        </div>
      )} */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <Label
            htmlFor="firstName"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            First name
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => {
              if (e.target.value.length <= 50) {
                handleInputChange("firstName", e.target.value);
              }
            }}
            disabled={!isEditing}
            className="bg-gray-50 border-gray-200"
            maxLength={50}
          />
        </div>

        {/* Surname */}
        <div>
          <Label
            htmlFor="surname"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Surname
          </Label>
          <Input
            id="surname"
            value={formData.surname}
            onChange={(e) => {
              if (e.target.value.length <= 50) {
                handleInputChange("surname", e.target.value);
              }
            }}
            disabled={!isEditing}
            className="bg-gray-50 border-gray-200"
            maxLength={50}
          />
        </div>

        <div className="relative">
  <Label
    htmlFor="email"
    className="text-sm font-medium text-gray-700 mb-2 block"
  >
    Email Address
  </Label>
  <Input
    id="email"
    type="email"
    value={formData.email}
    disabled
    className="bg-gray-50 border-gray-200 pr-24"
    maxLength={254}
  />

  {/* Inline Change Button */}
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setIsEmailModalOpen(true)}
    className="absolute right-1.5 top-[30px] text-sm text-blue-600 hover:text-blue-800 hover:bg-transparent"
  >
    Change
  </Button>
</div>

       

        {/* Country */}
        <div>
          <Label
            htmlFor="country"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Country
          </Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => {
              if (e.target.value.length <= 56) {
                handleInputChange("country", e.target.value);
              }
            }}
            disabled={!isEditing}
            className="bg-gray-50 border-gray-200"
            maxLength={56}
          />
        </div>
      </div>

      {isEditing && (
        <div className="mt-8">
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-blue-700 text-white px-8 py-2"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Updating..." : "Update"}
          </Button>
        </div>
      )}

      <div className="t-12 mt-8 border-t border-gray-200">
        <div className="mt-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Button
                onClick={handleDisable}
                className="bg-amber-600 hover:bg-amber-700 w-full text-white px-8 py-2 h-12"
                disabled={disableFlowMutation.isPending}
                aria-label="Disable account"
              >
                {disableFlowMutation.isPending
                  ? "Disabling..."
                  : "Disable Account"}
              </Button>
            </div>

            <div>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 w-full text-white px-8 py-2 h-12"
                disabled={deleteFlowMutation.isPending}
                aria-label="Delete account"
              >
                {deleteFlowMutation.isPending
                  ? "Deleting..."
                  : "Delete Account"}
              </Button>

              <p className="text-xs text-red-600 mt-2 text-center">
                Deleting your account starts a 30-day grace period. If you
                change your mind, you can log in again within 30 days to restore
                your account. After 30 days, your account and its data will be
                permanently deleted.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disable Confirmation Modal (with password prompt) */}
      <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Disable</DialogTitle>
            <DialogDescription>
              Please confirm your identity to temporarily disable your account.
              You can re-enable it later per your organization's policy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label
                htmlFor="disable-email"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Email
              </Label>
              <Input
                id="disable-email"
                type="email"
                value={email}
                disabled
                className="bg-gray-50 border-gray-200"
                maxLength={254}
              />
            </div>
            <div>
              <Label
                htmlFor="disable-password"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="disable-password"
                  type={showDisablePassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={disablePassword}
                  onChange={(e) => {
                    if (e.target.value.length <= 128) {
                      setDisablePassword(e.target.value);
                    }
                  }}
                  className="bg-gray-50 border-gray-200 pr-10"
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowDisablePassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={
                    showDisablePassword ? "Hide password" : "Show password"
                  }
                >
                  {showDisablePassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDisableModalOpen(false)}
              disabled={disableFlowMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDisable}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={disableFlowMutation.isPending}
            >
              {disableFlowMutation.isPending
                ? "Disabling..."
                : "Disable Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal (with password prompt + eye toggle) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Please confirm your identity to permanently delete your account.
              You can still log back in within 30 days to restore it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label
                htmlFor="delete-email"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Email
              </Label>
              <Input
                id="delete-email"
                type="email"
                value={email}
                disabled
                className="bg-gray-50 border-gray-200"
                maxLength={254}
              />
            </div>
            <div>
              <Label
                htmlFor="delete-password"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="delete-password"
                  type={showDeletePassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => {
                    if (e.target.value.length <= 128) {
                      setDeletePassword(e.target.value);
                    }
                  }}
                  className="bg-gray-50 border-gray-200 pr-10"
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={
                    showDeletePassword ? "Hide password" : "Show password"
                  }
                >
                  {showDeletePassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteFlowMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteFlowMutation.isPending}
            >
              {deleteFlowMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ChangeEmailModal
        open={isEmailModalOpen}
        onOpenChange={setIsEmailModalOpen}
        currentEmail={formData.email}
        onEmailUpdated={(email) =>
          setFormData((prev) => ({ ...prev, email }))
        }
      />

    </div>
  );
}
