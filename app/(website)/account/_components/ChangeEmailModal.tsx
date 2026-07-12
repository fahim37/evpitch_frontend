"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { SecurityQuestions } from "./security-questions";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";

interface ChangeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  onEmailUpdated?: (email: string) => void;
}

export function ChangeEmailModal({
  open,
  onOpenChange,
  currentEmail,
  onEmailUpdated,
}: ChangeEmailModalProps) {
  const [step, setStep] = useState<"security" | "email">("security");
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const token = session?.accessToken;

  const resetState = () => {
    setStep("security");
    setNewEmail("");
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const handleSecurityComplete = () => {
    setStep("email");
  };

  const handleEmailSubmit = async () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      toast.error("Please enter a new email address.");
      return;
    }
    if (trimmedEmail === currentEmail) {
      toast.error("Please enter a different email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/change-email`,
        { email: trimmedEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.success) {
        toast.success("Email updated successfully. Please sign in again.");
        onEmailUpdated?.(trimmedEmail);
        resetState();
        onOpenChange(false);
        await signOut({ callbackUrl: "/login", redirect: true });
        return;
      }

      toast.error(res.data?.message || "Failed to update email.");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        "Failed to update email. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {step === "security" && (
          <>
            <DialogHeader>
              <DialogTitle>Verify Your Identity</DialogTitle>
              <DialogDescription>
                Please answer your security questions to continue changing your
                email.
              </DialogDescription>
            </DialogHeader>

            <SecurityQuestions
              onBack={() => onOpenChange(false)}
              onComplete={handleSecurityComplete}
            />
          </>
        )}

        {step === "email" && (
          <>
            <DialogHeader>
              <DialogTitle>Enter New Email</DialogTitle>
              <DialogDescription>
                Update your account email after confirming your security
                questions. No OTP is required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label
                  htmlFor="current-email"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Current Email
                </Label>
                <Input
                  id="current-email"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div>
                <Label
                  htmlFor="new-email"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  New Email
                </Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="Enter your new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  maxLength={254}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("security")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={handleEmailSubmit}
                disabled={isSubmitting}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {isSubmitting ? "Updating..." : "Save Email"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
