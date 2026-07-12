"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import type { FormData } from "./forgot-password-form";
import Link from "next/link";

interface PasswordResetStepProps {
  formData: FormData;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
  onBack: () => void;
}

export default function PasswordResetStep({
  formData,
  onPasswordChange,
  onConfirmPasswordChange,
  onBack,
}: PasswordResetStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 10,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
    };
    return requirements;
  };

  const requirements = validatePassword(formData.password);
  const isPasswordValid = Object.values(requirements).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError(
        "Your new password does not meet our password policy requirements."
      );
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}/user/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          otp: formData.otp,
        }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || "Failed to reset password. Please try again."
        );
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Password Reset Successful
        </h1>
        <p className="text-gray-600">
          Your password has been successfully reset. You can now log in with
          your new password.
        </p>
        <Link href="/login">
          <Button className="w-full bg-primary hover:bg-blue-700">
            Go to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reset Password</h1>
        <p className="text-gray-600 mt-2">Create your password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={formData.password}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-blue-700"
          disabled={
            isLoading || !formData.password || !formData.confirmPassword
          }
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full bg-transparent"
          onClick={onBack}
        >
          Back
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-red-500 text-sm font-medium">Passwords should be:</p>
        <ul className="space-y-1 text-sm">
          <li
            className={requirements.length ? "text-green-600" : "text-red-500"}
          >
            A minimum of 10 characters
          </li>
          <li
            className={requirements.number ? "text-green-600" : "text-red-500"}
          >
            A minimum of 1 number
          </li>
          <li
            className={requirements.special ? "text-green-600" : "text-red-500"}
          >
            A minimum of 1 special character
          </li>
          <li
            className={requirements.upper ? "text-green-600" : "text-red-500"}
          >
            A minimum of 1 upper case character
          </li>
          <li
            className={requirements.lower ? "text-green-600" : "text-red-500"}
          >
            A minimum of 1 lower case character
          </li>
          <li className="text-red-500">
            You should not use any of your last 5 passwords
          </li>
          <li className="text-red-500">
            Keep your password as safe as your bank pin number!
          </li>
        </ul>
      </div>
    </div>
  );
}
