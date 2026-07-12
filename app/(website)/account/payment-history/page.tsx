import React, { Suspense } from "react";
import { PaymentHistory } from "../_components/payment-history";

function Page() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <PaymentHistory />
      </Suspense>
    </div>
  );
}

export default Page;
