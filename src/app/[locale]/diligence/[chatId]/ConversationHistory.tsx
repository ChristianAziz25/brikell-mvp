"use client";

import { motion } from "framer-motion";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

interface ConversationTurn {
  user: string;
  assistant: string;
}

interface ConversationHistoryProps {
  conversationTurns: ConversationTurn[];
}

export function ConversationHistory({
  conversationTurns,
}: ConversationHistoryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const previewAnimationRef = useRef<number | null>(null);

  // Smooth animation effect
  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor;

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }));
      previewAnimationRef.current = requestAnimationFrame(animate);
    };

    previewAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (previewAnimationRef.current) {
        cancelAnimationFrame(previewAnimationRef.current);
      }
    };
  }, [mousePosition]);

  const handlePreviewMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (previewContainerRef.current) {
      const rect = previewContainerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handlePreviewMouseEnter = (index: number) => {
    setHoveredIndex(index);
    setIsPreviewVisible(true);
  };

  const handlePreviewMouseLeave = () => {
    setHoveredIndex(null);
    setIsPreviewVisible(false);
  };

  return (
    <section
      ref={previewContainerRef}
      onMouseMove={handlePreviewMouseMove}
      className="relative flex flex-col w-64 top-0 self-start"
      style={{ height: "calc(100vh - 2rem)" }}
    >
      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar overscroll-y-contain p-2 flex-1 min-h-0">
        {conversationTurns.map((turn, index) => (
          <div
            key={index}
            style={{
              perspective: 900,
              width: "100%",
            }}
          >
            <motion.div
              onMouseEnter={() => handlePreviewMouseEnter(index)}
              onMouseLeave={handlePreviewMouseLeave}
              whileHover={{
                rotateX: -8,
                rotateY: 8,
                zIndex: 20,
                scale: 1.04,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                width: "100%",
                aspectRatio: "16/9",
                transformStyle: "preserve-3d",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              className="rounded-xl bg-card shadow-lg px-3 py-2"
            >
              <div className="mb-1 text-xs font-semibold text-muted-foreground truncate">
                You: {turn.user}
              </div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground truncate">
                Assistant: {turn.assistant}
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Floating preview popup */}
      <div
        className="pointer-events-none absolute z-50 overflow-hidden rounded-xl shadow-2xl"
        style={{
          transform: `translate3d(${smoothPosition.x + 16}px, ${
            smoothPosition.y - 60
          }px, 0)`,
          opacity:
            isPreviewVisible &&
            hoveredIndex !== null &&
            !!conversationTurns.length
              ? 1
              : 0,
          scale:
            isPreviewVisible &&
            hoveredIndex !== null &&
            !!conversationTurns.length
              ? 1
              : 0.8,
          transition:
            "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), scale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="relative w-[360px] max-w-[420px] bg-card rounded-xl border border-border">
          {hoveredIndex !== null && conversationTurns[hoveredIndex] && (
            <div className="flex h-full w-full flex-col p-4 gap-2">
              <div className="text-xs font-semibold text-muted-foreground">
                You
              </div>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                {conversationTurns[hoveredIndex].user}
              </div>
              <div className="mt-2 text-xs font-semibold text-muted-foreground">
                Assistant
              </div>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                {conversationTurns[hoveredIndex].assistant}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
