"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const OTP_DURATION_SECONDS = 600; // 10 minutes

interface VerifyOTPProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function VerifyOTP({ email, onBack, onSuccess }: VerifyOTPProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const expiryStorageKey =
    email && typeof window !== "undefined"
      ? `otp-expiry:${email}`
      : null;

  useEffect(() => {
    if (!email || !expiryStorageKey) return;
    const now = Date.now();
    const storedExpiry = Number(
      sessionStorage.getItem(expiryStorageKey) || ""
    );
    const expiry =
      storedExpiry && storedExpiry > now
        ? storedExpiry
        : now + OTP_DURATION_SECONDS * 1000;

    setOtpExpiresAt(expiry);
    sessionStorage.setItem(expiryStorageKey, String(expiry));
  }, [email, expiryStorageKey]);

  useEffect(() => {
    if (!otpExpiresAt) {
      setTimeLeft(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((otpExpiresAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [otpExpiresAt]);

  /* ---------------- Verify OTP Mutation ---------------- */
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const otpString = otp.join("");
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/user/verify`, {
        email,
        otp: otpString,
      });
      return response.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success("OTP verified successfully!");
        onSuccess();
        window.location.reload();
      } else {
        toast.error(res.message || "Verification failed.");
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Invalid or expired OTP. Please try again.";
      toast.error(msg);
    },
  });
  const isExpired = otpExpiresAt !== null && timeLeft <= 0;

  /* ---------------- OTP Input Behavior ---------------- */
  const focusInput = (index: number) => {
    const el = inputsRef.current[index];
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < otp.length - 1) focusInput(index + 1);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        focusInput(index - 1);
      }
    }
  };

  // ✅ Paste Handler (NEW)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("Text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);

    // Focus next empty input (or last one)
    const nextIndex = Math.min(pastedData.length, 5);
    focusInput(nextIndex);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (isExpired) {
      toast.error("Code expired. Please resend a new OTP.");
      setResendCooldown(0);
      return;
    }
    if (otpString.length === 6) {
      mutate();
    } else {
      toast.error("Please enter the full 6-digit OTP.");
    }
  };

  const handleResendCode = async () => {
    try {
      toast.info("Resending OTP...");
      setResendCooldown(60);
      const newExpiry = Date.now() + OTP_DURATION_SECONDS * 1000;
      setOtpExpiresAt(newExpiry);
      setTimeLeft(Math.ceil(OTP_DURATION_SECONDS));
      if (expiryStorageKey) {
        sessionStorage.setItem(expiryStorageKey, String(newExpiry));
      }
      setOtp(["", "", "", "", "", ""]);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/resend-otp`,
        { email }
      );

      if (res.data?.success) {
        toast.success("OTP resent successfully!");
      } else {
        toast.error(res.data?.message || "Failed to resend OTP.");
        setResendCooldown(0);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to resend OTP.";
      toast.error(msg);
      setResendCooldown(0);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center text-sm text-gray-600">
        Expires in {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </div>
      {isExpired && (
        <p className="text-center text-sm text-red-600">
          Code expired. Please resend a new OTP.
        </p>
      )}

      <div className="space-y-5">

        <div className="flex justify-center space-x-2 ">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el
              }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste} // 👈 Added paste handler here
              className="w-12 h-12 text-center text-lg font-semibold"
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Didn't get a code?</span>
        <button
          type="button"
          onClick={handleResendCode}
          disabled={resendCooldown > 0 && !isExpired}
          className={`text-sm ${(resendCooldown > 0 && !isExpired) ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:underline"}`}
        >
          {resendCooldown > 0 && !isExpired
            ? `Resend in ${resendCooldown}s`
            : "Resend Code"}
        </button>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isPending || otp.join("").length !== 6 || isExpired}
          className="flex-1 bg-primary hover:bg-blue-700 text-white"
        >
          {isPending ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </form>
  );
}


