import { Suspense } from "react";
import VerifyPage from "@/components/auth/VerifyPage"; // Adjust path if needed

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPage />
    </Suspense>
  );
}
