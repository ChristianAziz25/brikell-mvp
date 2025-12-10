"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { useMemo } from "react";

// Pre-create motion components so we don't call motion() during render.
const motionTags = {
  p: motion.p,
  span: motion.span,
  div: motion.div,
} as const;

type MotionTag = keyof typeof motionTags;

interface TextShimmerProps {
  children: string;
  as?: MotionTag;
  className?: string;
  duration?: number;
  spread?: number;
}

export function TextShimmer({
  children,
  as = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = motionTags[as];

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        "relative inline-block bg-size-[250%_100%,auto] bg-clip-text",
        // Base color: theme muted foreground; animated highlight: white
        "text-transparent [--base-color:var(--muted-foreground)] [--base-gradient-color:#ffffff]",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        className
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
}
