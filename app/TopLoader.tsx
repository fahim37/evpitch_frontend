"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, trickleSpeed: 200 });

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.start();
    NProgress.done();
  }, [pathname, searchParams]);

  return (
    <>
      <style jsx global>{`
        /* NProgress custom styles */
        #nprogress .bar {
          background: #3b82f6; /* Tailwind blue-500 */
          height: 4px; /* Thickness */
        }

        #nprogress .peg {
          box-shadow: 0 0 10px #3b82f6, 0 0 5px #3b82f6;
        }
      `}</style>
    </>
  );
}
