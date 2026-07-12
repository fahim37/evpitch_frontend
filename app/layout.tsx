import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query";
import { Roboto } from "next/font/google";
import { Toaster } from "sonner";
import { DynamicTitle } from "@/components/DynamicTitle";
import TopLoader from "./TopLoader";
import { Suspense } from "react";

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://evpitch.com"),
  title: "Elevator Video Pitch©",
  description: "Shape Your Future with the Right Elevator Video Pitch©",
  openGraph: {
    title: "Elevator Video Pitch©",
    description: "Shape Your Future with the Right Elevator Video Pitch©",
    url: "https://evpitch.com",
    siteName: "Elevator Video Pitch©",
    type: "website",
  },
  icons: {
    icon: "/assets/fav.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <Suspense fallback={null}>
          <DynamicTitle />
          <TopLoader />
        </Suspense>
        <ReactQueryProvider>{children}</ReactQueryProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
