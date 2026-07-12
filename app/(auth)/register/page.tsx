import { Suspense } from "react";
import RegisterPage from "./_components/RegisterClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <RegisterPage />
    </Suspense>
  );
}
