"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DOMPurify from "dompurify";
import clsx from "clsx";

type DescriptionClampProps = {
  html: string;           // unsafe HTML (sanitized inside)
  className?: string;
  maxLines?: number;      // default: 4
  seeMoreText?: string;   // default: "See more"
  seeLessText?: string;   // default: "See less"
};

export function DescriptionClamp({
  html,
  className,
  maxLines = 4,
  seeMoreText = "See more",
  seeLessText = "See less",
}: DescriptionClampProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [needClamp, setNeedClamp] = useState(false);
  const [collapsedH, setCollapsedH] = useState<number>(0);
  const [fullH, setFullH] = useState<number | "auto">("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const safeHTML = useMemo(() => DOMPurify.sanitize(html ?? ""), [html]);

  const recompute = () => {
    const meas = measureRef.current;
    if (!meas) return;

    const cs = window.getComputedStyle(meas);
    const lineHeight = parseFloat(cs.lineHeight || "20") || 20;

    meas.style.maxHeight = "none";
    const fullHeight = meas.scrollHeight;

    const targetCollapsed = Math.ceil(lineHeight * maxLines + 2);
    setFullH(fullHeight);
    setCollapsedH(targetCollapsed);
    setNeedClamp(fullHeight > targetCollapsed + 1);
  };

  useLayoutEffect(() => {
    if (!mounted) return;
    recompute();
    const ro = new ResizeObserver(recompute);
    if (measureRef.current) ro.observe(measureRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, safeHTML, maxLines]);

  const targetMaxH =
    needClamp && !expanded && typeof collapsedH === "number"
      ? collapsedH
      : typeof fullH === "number"
      ? fullH
      : "auto";

  return (
    <div className={clsx("relative", className)}>
      {/* Hidden measurer with same text metrics */}
      <div
        ref={measureRef}
        className="invisible absolute -z-10 pointer-events-none left-0 top-0 w-full text-sm sm:text-[15px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: safeHTML }}
      />

      {/* Click text to expand/collapse (only if clamped) */}
      <AnimatePresence initial={false}>
        <motion.div
          key="desc"
          ref={containerRef}
          initial={false}
          animate={{ maxHeight: targetMaxH, opacity: 1 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className={clsx(
            "overflow-hidden relative text-gray-700",
            "text-sm sm:text-[15px] leading-relaxed cursor-text"
          )}
          onClick={(e) => {
            if (!needClamp) return;
            e.stopPropagation();
            setExpanded((s) => !s);
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: safeHTML }} />
          {needClamp && !expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
          )}
        </motion.div>
      </AnimatePresence>

      {needClamp && (
        <div className="mt-2">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((s) => !s);
            }}
            className="text-primary text-sm font-medium underline underline-offset-2 hover:opacity-90"
          >
            {expanded ? seeLessText : seeMoreText}
          </button>
        </div>
      )}
    </div>
  );
}
