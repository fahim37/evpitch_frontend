import React, { Suspense } from "react";
import MessagingPage from "./_components/messagesPage";

function Page() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <MessagingPage />
      </Suspense>
    </div>
  );
}

export default Page;
