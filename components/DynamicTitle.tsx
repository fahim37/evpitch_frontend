// app/_components/DynamicTitle.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DynamicTitle() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Convert "/about-us" -> "About Us"
    let routeName =
      pathname === "/"
        ? "Home"
        : pathname
            .replace(/\//g, " ") // remove slashes
            .replace(/-/g, " ") // replace hyphens with spaces
            .trim();

    routeName = routeName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    document.title = `${routeName} | Elevator Video Pitch`;
  }, [pathname]);

  return null; // no UI
}
