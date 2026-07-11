import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ibm, sans, mono } from "../theme/ibm";
import type { Accent } from "../theme/ibm";

// Top-left step indicator: a mono two-digit index in an accent block, plus the
// scene tag. Slides in from the left.
export const StepChip: React.FC<{
  index: number;
  total: number;
  tag: string;
  accent: Accent;
}> = ({ index, total, tag, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200 } });
  const x = interpolate(p, [0, 1], [-40, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 116,
        left: 116,
        zIndex: 3,
        display: "inline-flex",
        alignItems: "center",
        gap: 16,
        padding: "8px 20px 8px 8px",
        borderRadius: 6,
        background: `${ibm.gray100}d9`,
        backdropFilter: "blur(10px)",
        border: `1px solid ${ibm.gray80}`,
        transform: `translateX(${x}px)`,
        opacity: p,
      }}
    >
      <div
        style={{
          fontFamily: mono,
          fontWeight: 600,
          fontSize: 30,
          color: ibm.white,
          background: accent.base,
          padding: "8px 16px",
          borderRadius: 2,
          boxShadow: `0 8px 30px ${accent.base}66`,
        }}
      >
        {String(index).padStart(2, "0")}
        <span style={{ opacity: 0.6 }}> / {String(total).padStart(2, "0")}</span>
      </div>
      <div
        style={{
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: ibm.gray10,
        }}
      >
        {tag}
      </div>
    </div>
  );
};
