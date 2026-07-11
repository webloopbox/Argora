import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { ibm } from "../theme/ibm";

// Carbon-dark base with a slow-drifting IBM dot grid and two soft accent
// glows. Deliberately GPU-light: one SVG pattern + two radial gradients.
export const Background: React.FC<{
  accent?: string;
  glow?: boolean;
}> = ({ accent = ibm.blue60, glow = true }) => {
  const frame = useCurrentFrame();
  const drift = (frame % 1200) / 1200; // 0..1 slow loop
  const offset = drift * 48;

  return (
    <AbsoluteFill style={{ backgroundColor: ibm.gray100 }}>
      {/* Dot grid */}
      <AbsoluteFill style={{ opacity: 0.5 }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="dots"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${offset} ${offset})`}
            >
              <circle cx="2" cy="2" r="1.6" fill={ibm.gray80} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </AbsoluteFill>

      {glow ? (
        <>
          <AbsoluteFill
            style={{
              background: `radial-gradient(1100px 700px at 18% 12%, ${accent}22, transparent 60%)`,
              opacity: interpolate(
                Math.sin(frame / 60),
                [-1, 1],
                [0.55, 0.9],
              ),
            }}
          />
          <AbsoluteFill
            style={{
              background: `radial-gradient(900px 900px at 88% 96%, ${ibm.purple60}18, transparent 62%)`,
            }}
          />
        </>
      ) : null}

      {/* Subtle top-to-bottom vignette for text legibility */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${ibm.black}00 55%, ${ibm.black}66 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
