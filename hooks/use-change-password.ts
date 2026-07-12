"use client";

import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

// Input data interface
interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// API response interface (assumed based on typical API response structure)
interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data?: unknown; // Adjust based on actual response data, if any
}

export function useChangePassword() {
  const { data: session } = useSession();
  const token = session?.accessToken || "";

  return useMutation<ChangePasswordResponse, Error, ChangePasswordData>({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/user/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      return response.json();
    },
  });
}