"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authAPI } from "@/lib/auth-api";

const OTP_DURATION_SECONDS = 600; // 10 minutes

export default function VerifyPage() {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const expiryStorageKey =
    email && typeof window !== "undefined"
      ? `otp-expiry:${email}`
      : null;

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

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

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Destructure isPending and mutate from useMutation (v5)
  const {
    mutate,
    status, // "idle" | "pending" | "success" | "error"
    isPending, // boolean helper you should use for "loading" state on mutations
    error,
  } = useMutation({
    mutationFn: authAPI.verifyOTP,
    onSuccess: () => {
      router.push(`/security-questions?email=${encodeURIComponent(email)}`);
    },
    onError: (err) => {
      console.error("OTP verification failed:", err);
    },
  });

  const focusInput = (index: number) => {
    const el = inputsRef.current[index];
    el?.focus();
    if (el) {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < inputsRef.current.length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        focusInput(index - 1);
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < inputsRef.current.length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasteData) return;

    const pasteDigits = pasteData.split("");
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < Math.min(6, pasteDigits.length); i++) {
      newOtp[i] = pasteDigits[i];
    }
    setOtp(newOtp);

    const firstEmpty = newOtp.findIndex((d) => d === "");
    if (firstEmpty === -1) {
      focusInput(5);
    } else {
      focusInput(firstEmpty);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpExpiresAt && timeLeft <= 0) {
      setResendMessage("Code expired. Please resend a new OTP.");
      setResendCooldown(0);
      return;
    }

    if (otpString.length === 6) {
      // use mutate (destructured) instead of verifyMutation.mutate
      mutate({
        email,
        otp: otpString,
      } as any);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    setResendMessage(null);
    try {
      setResendCooldown(60);
      const newExpiry = Date.now() + OTP_DURATION_SECONDS * 1000;
      setOtpExpiresAt(newExpiry);
      setTimeLeft(Math.ceil(OTP_DURATION_SECONDS));
      if (expiryStorageKey) {
        sessionStorage.setItem(expiryStorageKey, String(newExpiry));
      }
      setOtp(["", "", "", "", "", ""]);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/resend-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to resend");
      }
      setResendMessage("A new code has been sent to your email.");
    } catch (err) {
      setResendMessage("Failed to resend code. Please try again.");
      setResendCooldown(0);
    }
  };

  // Use isPending (mutation) — this is the correct boolean to show a "loading" state for a mutation in v5
  const isVerifying = isPending;
  const isExpired = otpExpiresAt !== null && timeLeft <= 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Enter OTP</CardTitle>
          <p className="text-gray-600">
            We have sent a code to your registered email address (Expires in 10 minutes)
          </p>
          <p className="text-sm text-gray-600">
            Expires in {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </p>
          {isExpired && (
            <p className="text-sm text-red-600">
              Code expired. Please tap Resend Code to get a fresh OTP.
            </p>
          )}
          {resendMessage && (
            <p className="text-sm text-gray-700 mt-1">{resendMessage}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  ref={(el: HTMLInputElement | null) => {
                    inputsRef.current[index] = el;
                  }}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold"
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {"Didn't get a code?"}
              </span>
              <button
                type="button"
                onClick={handleResendCode}
                className={`text-sm ${(resendCooldown > 0 && !isExpired) ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:underline"}`}
                disabled={resendCooldown > 0 && !isExpired}
              >
                {resendCooldown > 0 && !isExpired
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Code"}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isVerifying || otp.join("").length !== 6 || isExpired}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>

            {status === "error" && error && (
              <p className="text-sm text-red-600 mt-2">
                Verification failed. Please try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
