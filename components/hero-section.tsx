"use client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { Search } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJobTitle = searchParams.get("title") || "";
  const [jobTitleInput, setJobTitleInput] = useState(initialJobTitle);



  const handleSearch = () => {
    const currentParams = new URLSearchParams();
    if (jobTitleInput) {
      currentParams.set("title", jobTitleInput);
    }
    currentParams.set("page", "1");
    router.push(`/alljobs?${currentParams.toString()}`);
  };

  const bubbleVariants: Variants = {
    float: {
      y: [0, -8, 0],
      x: [0, 2, 0],
      rotate: [0, 5, 0],
      transition: {
        duration: 4,
        repeat: Number.POSITIVE_INFINITY,
        ease: [0.4, 0.0, 0.2, 1] as const,
      },
    },
    floatSlow: {
      y: [0, -12, 0],
      x: [0, -3, 0],
      rotate: [0, -3, 0],
      transition: {
        duration: 6,
        repeat: Number.POSITIVE_INFINITY,
        ease: [0.4, 0.0, 0.2, 1] as const,
      },
    },
    floatFast: {
      y: [0, -6, 0],
      x: [0, 4, 0],
      rotate: [0, 8, 0],
      transition: {
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: [0.4, 0.0, 0.2, 1] as const,
      },
    },
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
      },
    },
  };

  const formVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
        delay: 0.4,
      },
    },
  };

  const badgeVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <section className="container relative w-full px-4 py-8 md:py-12 lg:py-24 overflow-hidden md:min-h-[70vh]">
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-blue-100/20 pointer-events-none"
        suppressHydrationWarning={true}
      />

      {/* === Decorative bubbles (DESKTOP/TABLET ONLY) === */}
      {/* All bubbles below are hidden on mobile with `hidden md:block` so they don't sit behind text. */}
      {/* <motion.div
        variants={bubbleVariants}
        animate="floatSlow"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute top-[8%] left-[2%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className="border border-[#9EC7DC] rounded-full p-2 w-[20px] h-[20px] lg:w-[40px] lg:h-[40px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div> */}

      <motion.div
        variants={bubbleVariants}
        animate="float"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute top-[12%] right-[35%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className=" border border-[#9EC7DC] rounded-full p-2 w-[60px] h-[60px] lg:w-[100px] lg:h-[100px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatFast"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute top-[10%] right:[15%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className=" border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[40px] lg:h-[40px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatSlow"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute top-[18%] right-[5%] hidden lg:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className=" border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[60px] lg:h-[60px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatSlow"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="absolute top-[55%] left-[20%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[60px] lg:h-[60px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="float"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute top-[35%] right-[25%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[60px] lg:h-[60px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatFast"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute top-[40%] right-[8%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[90px] lg:h-[90px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="float"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.6 }}
        className="absolute bottom-[30%] right-[40%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[70px] lg:h-[70px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatSlow"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.8 }}
        className="absolute bottom-[20%] right-[15%] hidden lg:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[100px] lg:h-[100px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatFast"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 2.0 }}
        className="absolute bottom-[15%] right-[5%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[40px] lg:h-[40px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatFast"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 2.0 }}
        className="absolute bottom-[35%] right-[30%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[40px] lg:h-[40px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      {/* === Content === */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container px-0 md:px-6 grid lg:grid-cols-2 gap-8 items-center relative z-10"
        suppressHydrationWarning={true}
      >
        <div
          className="flex flex-col text-left"
          suppressHydrationWarning={true}
        >
          <motion.h1
            variants={itemVariants}
            className="text-2xl font-bold leading-[120%] sm:text-3xl md:text-[40px] text-[#2B7FD0]"
          >
            Shape Your Career <br className="hidden sm:block" /> with the Right
            Elevator Pitch
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-sm md:text-[16px] font-normal leading-[150%] text-[#595959] max-w-[355px] lg:mx-0 mt-6 md:mt-[48px]"
          >
            Unlock your full potential and begin creating the life you truly
            deserve — one meaningful opportunity at a time.
          </motion.p>

          {session?.status === "authenticated" && (
            <motion.div
              variants={formVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:max-w-[396px] mt-8 md:mt-[48px] mx-auto lg:mx-0"
            >
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
                >
                  {/* Job Title Input */}
                  <div className="space-y-1 text-start">
                    <Label
                      htmlFor="job-title"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Search for
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="job-title"
                        placeholder="Title, Skill, Category, Location, Location Type"
                        className="w-full pl-8 border-none h-[28px] px-0 !focus:outline-none !focus:ring-0 outline-none"
                        value={jobTitleInput}
                        onChange={(e) => setJobTitleInput(e.target.value)}
                      />
                    </div>
                  </div>

                 
                </motion.div>

                {/* Search Button */}
                <div className="flex items-start justify-start">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      onClick={handleSearch}
                      className="w-full sm:w-[160px] bg-[#2B7FD0] hover:bg-[#2B7FD0]/80 h-[51px] text-white rounded-[8px] mt-2 sm:mt-6 transition-all duration-300"
                    >
                      Search
                    </Button>
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.8,
                    },
                  },
                }}
                className="flex flex-wrap gap-2 items-center justify-center lg:justify-start text-xs sm:text-sm mt-6 md:mt-[48px]"
              ></motion.div>
            </motion.div>
          )}

          {/* === Mobile-only decorative bubble strip BELOW the text === */}
          {/* Gives dedicated space so bubbles never sit behind text on small screens. */}
          <div className="md:hidden w-full mt-2 sm:mt-2">
            <div className="relative h-32 sm:h-36 rounded-xl overflow-hidden">
              {/* soft glows */}
              <div className="absolute -top-6 left-10 w-24 h-24 bg-blue-200/40 blur-2xl rounded-full" />
              <div className="absolute -bottom-8 right-8 w-28 h-28 bg-cyan-200/40 blur-2xl rounded-full" />

              {/* bubble row (mobile only) */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 },
                  },
                }}
                className="absolute inset-0"
              >
                {/* 1 */}
                <motion.div
                  variants={bubbleVariants}
                  animate="float"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className="absolute left-[4%] bottom-2"
                >
                  <Image
                    src="/assets/hero.png"
                    alt="Decorative"
                    width={40}
                    height={40}
                    className="border border-[#9EC7DC] rounded-full p-1 w-[26px] h-[26px] opacity-80"
                  />
                </motion.div>

                {/* 2 */}
                <motion.div
                  variants={bubbleVariants}
                  animate="floatSlow"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.12 }}
                  className="absolute left-[20%] bottom-1"
                >
                  <Image
                    src="/assets/hero.png"
                    alt="Decorative"
                    width={52}
                    height={52}
                    className="border border-[#9EC7DC] rounded-full p-1.5 w-[34px] h-[34px] opacity-80"
                  />
                </motion.div>

                {/* 3 (centerpiece) */}
                <motion.div
                  variants={bubbleVariants}
                  animate="float"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.75, delay: 0.18 }}
                  className="absolute left-1/2 -translate-x-1/2 bottom-0"
                >
                  <Image
                    src="/assets/hero.png"
                    alt="Decorative"
                    width={70}
                    height={70}
                    className="border border-[#9EC7DC] rounded-full p-2 w-[48px] h-[48px] opacity-80"
                  />
                </motion.div>

                {/* 4 */}
                <motion.div
                  variants={bubbleVariants}
                  animate="floatFast"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.24 }}
                  className="absolute left-[64%] bottom-2"
                >
                  <Image
                    src="/assets/hero.png"
                    alt="Decorative"
                    width={48}
                    height={48}
                    className="border border-[#9EC7DC] rounded-full p-1 w-[30px] h-[30px] opacity-80"
                  />
                </motion.div>

                {/* 5 */}
                <motion.div
                  variants={bubbleVariants}
                  animate="floatSlow"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="absolute left-[78%] bottom-3"
                >
                  <Image
                    src="/assets/hero.png"
                    alt="Decorative"
                    width={56}
                    height={56}
                    className="border border-[#9EC7DC] rounded-full p-1.5 w-[36px] h-[36px] opacity-80"
                  />
                </motion.div>

                {/* 6 (small accent) */}
                <motion.div
                  variants={bubbleVariants}
                  animate="floatFast"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.55, delay: 0.36 }}
                  className="absolute right-[4%] bottom-2"
                >
                  <Image
                    src="/assets/hero.png"
                    alt="Decorative"
                    width={36}
                    height={36}
                    className="border border-[#9EC7DC] rounded-full p-1 w-[22px] h-[22px] opacity-80"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
