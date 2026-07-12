"use client";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useChangePassword } from "@/hooks/use-change-password";

interface ChangePasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ChangePassword({
  onShowSecurityQuestions,
}: {
  onShowSecurityQuestions: () => void;
}) {
  const [passwords, setPasswords] = useState<ChangePasswordFormData>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const mutation = useChangePassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPasswords = {
      oldPassword: passwords.oldPassword.trim(),
      newPassword: passwords.newPassword.trim(),
      confirmPassword: passwords.confirmPassword.trim(),
    };

    if (trimmedPasswords.newPassword !== trimmedPasswords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (trimmedPasswords.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    mutation.mutate(
      {
        oldPassword: trimmedPasswords.oldPassword,
        newPassword: trimmedPasswords.newPassword,
        confirmPassword: trimmedPasswords.confirmPassword,
      },
      {
        onSuccess: () => {
          toast.success("Password changed successfully!");
          setPasswords({
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        },
        onError: (error) => {
          toast.error(error.message || "Failed to change password");
        },
      }
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Change Password</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="oldPassword">Current Password</Label>
          <Input
            id="oldPassword"
            type="password"
            value={passwords.oldPassword}
            onChange={(e) =>
              setPasswords((prev) => ({ ...prev, oldPassword: e.target.value }))
            }
            placeholder="Your current password"
            className="mt-2"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              placeholder="New Password"
              className="mt-2 pr-10"
              required
              aria-describedby="password-requirements"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 mt-7"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          <div className="relative">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              placeholder="Confirm Password"
              className="mt-2 pr-10"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 mt-7"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-blue-700"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Updating..." : "Update Password"}
        </Button>

        <div>
          <p className="text-sm text-blue-600 cursor-pointer hover:underline">
            Forgot your password?{" "}
            <span onClick={onShowSecurityQuestions}>Security Questions</span>
          </p>
        </div>
      </form>
    </div>
  );
}
