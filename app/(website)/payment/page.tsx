// app/checkout/paypal/page.tsx
import { Suspense } from "react";
import PayPalCheckoutClient from "./_components/paypal.client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <svg className="h-12 w-12 animate-spin" viewBox="0 0 24 24" />
        </div>
      }
    >
      <PayPalCheckoutClient />
    </Suspense>
  );
}
