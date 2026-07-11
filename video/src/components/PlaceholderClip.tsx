import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { ibm, sans, mono } from "../theme/ibm";
import type { Accent } from "../theme/ibm";

// Shown in a scene when its screen recording isn't dropped in yet. Styled so
// the preview looks intentional (not broken) while you're still filming.
export const PlaceholderClip: React.FC<{
  index: number;
  tag: string;
  clip: string | null;
  accent: Accent;
}> = ({ index, tag, clip, accent }) => {
  const frame = useCurrentFrame();
  const scan = interpolate(frame % 150, [0, 150], [0, 100]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${ibm.gray90}, ${ibm.gray100})`,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* moving scan line */}
      <div
        style={{
          position: "absolute",
          top: `${scan}%`,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent.base}, transparent)`,
          opacity: 0.5,
        }}
      />
      <div style={{ textAlign: "center", color: ibm.gray30 }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 200,
            fontWeight: 700,
            color: accent.base,
            lineHeight: 1,
          }}
        >
          {String(index).padStart(2, "0")}
        </div>
        <div
          style={{
            fontFamily: sans,
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginTop: 8,
            color: ibm.gray10,
          }}
        >
          {tag}
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 26,
            marginTop: 28,
            color: ibm.gray50,
          }}
        >
          drop&nbsp;
          <span style={{ color: accent.bright }}>
            {clip ?? `clips/step-${String(index).padStart(2, "0")}.mp4`}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
