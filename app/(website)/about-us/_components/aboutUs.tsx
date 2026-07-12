"use client";

import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// 🫧 Bubble animation variants
const bubbleVariants: Variants = {
  float: {
    y: [0, -10, 0],
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const },
  },
  floatSlow: {
    y: [0, -15, 0],
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const },
  },
  floatFast: {
    y: [0, -8, 0],
    transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" as const },
  },
};

type BubbleVariantName = keyof typeof bubbleVariants;
type BubbleConfig = {
  top?: string;
  bottom?: string;
  right: string;
  size: number;
  variant: BubbleVariantName;
  delay: number;
};

// 🫧 Floating bubbles
function RightBackgroundBubbles() {
  return (
    <div className="absolute inset-0 flex justify-center items-center overflow-hidden pointer-events-none">
      <div className="relative w-full h-full">
        {([
          { top: "15%", right: "10%", size: 60, variant: "floatSlow", delay: 0.2 },
          { top: "25%", right: "25%", size: 30, variant: "floatFast", delay: 0.4 },
          { top: "40%", right: "15%", size: 70, variant: "float", delay: 0.6 },
          { top: "55%", right: "8%", size: 50, variant: "floatSlow", delay: 0.8 },
          { top: "60%", right: "25%", size: 50, variant: "floatFast", delay: 1.0 },
          { bottom: "20%", right: "20%", size: 80, variant: "floatSlow", delay: 1.2 },
        ] satisfies BubbleConfig[]).map((b, i) => (
          <motion.div
            key={i}
            variants={bubbleVariants}
            animate={b.variant}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 0.8, scale: 1 }}
            transition={{ duration: 0.8, delay: b.delay }}
            className={`absolute hidden md:block`}
            style={{ top: b.top, right: b.right, bottom: b.bottom }}
          >
            <Image
              src="/assets/hero.png"
              alt="Abstract bubble"
              width={b.size}
              height={b.size}
              className="border border-[#9EC7DC] rounded-full p-2 opacity-80 hover:scale-110 transition-transform duration-300"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// 🧠 Fetch data using TanStack Query
const fetchAboutContent = async () => {
  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_BASE_URL}/content/about`
  );
  return data;
};

const metadata = {
  title: "About | Elevator Video Pitch©",
  description: "Learn more about Elevator Video Pitch©",
};

export default function AboutUsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["content", "about"],
    queryFn: fetchAboutContent,
  });

  return (
    <div className="relative bg-white pb-20 overflow-hidden">
      <div className="container relative">
        <RightBackgroundBubbles />

        <div className="relative z-10">
          {isLoading && (
            <p className="text-center text-gray-500">Loading About Us...</p>
          )}
          {isError && (
            <p className="text-center text-red-600">
              ❌ Failed to load About content
            </p>
          )}

          {data && (
            <>
              <h1 className="text-[#131313] text-2xl md:text-3xl lg:text-5xl font-bold mt-6 mb-12 text-center" style={{ color: "rgb(43, 127, 208)" }}>
                {data.title || "About Us"}
              </h1>

              {/* Render Quill HTML safely */}
              <div
                className="prose max-w-4xl list-item list-none"
                dangerouslySetInnerHTML={{ __html: data?.data?.description || "" }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
