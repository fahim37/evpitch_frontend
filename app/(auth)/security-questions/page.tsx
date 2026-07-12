"use client";

import { Suspense } from "react";
import { SecurityQuestionsForm } from "@/components/auth/SecurityQuestionsForm";

export default function SecurityQuestionsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<div>Loading security questions...</div>}>
        <SecurityQuestionsForm />
      </Suspense>
    </div>
  );
}
