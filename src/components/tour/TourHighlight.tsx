"use client";

import { useEffect, useState } from "react";

const HIGHLIGHT_PADDING_PX = 8;

interface TourHighlightProps {
  target: string;
}

export function TourHighlight({ target }: TourHighlightProps) {
  const [dimensions, setDimensions] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const element = document.querySelector(`[data-tour="${target}"]`);
      if (!element) return;

      const rect = element.getBoundingClientRect();

      setDimensions({
        top: rect.top - HIGHLIGHT_PADDING_PX,
        left: rect.left - HIGHLIGHT_PADDING_PX,
        width: rect.width + HIGHLIGHT_PADDING_PX * 2,
        height: rect.height + HIGHLIGHT_PADDING_PX * 2,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    window.addEventListener("scroll", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("scroll", updateDimensions);
    };
  }, [target]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        data-testid="tour-backdrop"
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300"
      />

      {/* Highlight box */}
      <div
        data-testid="tour-highlight"
        className="fixed z-40 pointer-events-none animate-in fade-in duration-300"
        style={{
          top: `${dimensions.top}px`,
          left: `${dimensions.left}px`,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      >
        <div className="absolute inset-0 rounded-lg border-2 border-blue-500 shadow-lg shadow-blue-500/50" />
        <div className="absolute inset-0 rounded-lg bg-white/5" />
      </div>
    </>
  );
}
