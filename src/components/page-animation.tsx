"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageAnimationProps {
  children: ReactNode;
}

export function PageAnimation({ children }: PageAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

