import React from "react";
import BookmarksPage from "./_components/bookmarkspage";

function Page() {
  return (
    <div>
      <div className="text-center py-16">
        <h1 className="text-[40px] font-semibold leading-[120%]">
          Bookmarked Jobs
        </h1>
      </div>
      <BookmarksPage />
    </div>
  );
}

export default Page;
