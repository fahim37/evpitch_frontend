"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface PageHeaderProps {
  title: string;
  imge?: string;
  height?: string; // Only for large screens (default "500px")
  backgroundSize?: string;
}

export function PageHeader({
  title,
  imge,
  height = "350px",
  backgroundSize = "cover",
}: PageHeaderProps) {
  const [currentHeight, setCurrentHeight] = React.useState("350px");

  React.useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 480) {
        setCurrentHeight("200px"); // Mobile
      } else if (window.innerWidth <= 768) {
        setCurrentHeight("350px"); // Tablet
      } else {
        setCurrentHeight(height); // Desktop - uses the provided prop
      }
    }

    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial size
    return () => window.removeEventListener("resize", handleResize);
  }, [height]); // Re-run when height prop changes

  return (
    <div
      className={cn(
        "relative w-full flex flex-col items-center justify-center bg-black pt-10 "
      )}
      style={{
        backgroundImage: imge ? `url(${imge})` : undefined,
        backgroundSize,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top",
        top: 0,
        left: 0,
        height: currentHeight,
      }}
    >
      <div className={cn("relative z-10 flex flex-col items-center")}>
             

        <h1 className="bandit_font [text-shadow:_0_0_1px_#fff,_0_0_15px_#fff,_0_0_15px_#fff] font-benedict text-white text-center mb-5">
          {title}
        </h1>
      </div>
    </div>
  );
}