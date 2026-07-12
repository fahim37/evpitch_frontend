import type { Metadata } from "next";
import "../globals.css";
import { SiteHeader } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import ChatbotWidget from "@/components/chatbot-widget";

export const metadata: Metadata = {
  title: "Elevator Video Pitch©",
  description: "Shape Your Future with the Right Elevator Video Pitch©",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <SiteHeader /> 
      {children}
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
