import { Suspense } from "react";
import ClientJobApplication from "./components/main-page";

export default function Page() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <ClientJobApplication />
      </Suspense>
    </div>
  );
}
