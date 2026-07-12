"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F9FBFC] overflow-hidden">
      {/* Floating Ghost SVG */}
      <motion.div
        className="relative"
        initial={{ y: -10 }}
        animate={{ y: [0, -20, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          width="160"
          height="160"
        >
          <motion.path
            d="M32 2C18 2 8 12 8 26v26c0 2 2 4 4 4s4-2 4-4 2-4 4-4 4 2 4 4 2 4 4 4 4-2 4-4 2-4 4-4 4 2 4 4 2 4 4 4 4-2 4-4V26C56 12 46 2 32 2z"
            fill="#44B6CA"
          />
          <motion.circle
            cx="22"
            cy="28"
            r="4"
            fill="white"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.circle
            cx="42"
            cy="28"
            r="4"
            fill="white"
            animate={{ scale: [1.3, 1, 1.3] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <path
            d="M25 40c4 4 10 4 14 0"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* Text Section */}
      <motion.h1
        className="mt-8 text-[100px] font-extrabold text-[#44B6CA] leading-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        404
      </motion.h1>

      <motion.h2
        className="text-2xl font-semibold text-gray-700 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
      >
        Oops! Page not found
      </motion.h2>

      <motion.p
        className="text-gray-500 mt-3 text-center max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        The page you’re looking for doesn’t exist or has been moved.  
        Let’s get you back home safely!
      </motion.p>

      {/* Button */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <Button
          onClick={() => router.push("/")}
          className="bg-[#44B6CA] hover:bg-[#3A9FB0] text-white text-lg px-6 py-2"
        >
          Go Home
        </Button>
      </motion.div>
    </div>
  );
}
