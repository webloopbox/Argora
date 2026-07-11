import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ibm, sans } from "../theme/ibm";
import type { Accent } from "../theme/ibm";

// Lower-third caption that reveals short, title-style phrases word-by-word.
// Phrases are shown one at a time, evenly splitting the scene, so the motion
// stays in step with the voiceover without needing per-word audio timestamps.
export const AnimatedCaption: React.FC<{
  captions: string[];
  accent: Accent;
  durationInFrames: number;
  startFrame?: number;
}> = ({ captions, accent, durationInFrames, startFrame = 10 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const usable = Math.max(1, durationInFrames - startFrame);
  const slice = usable / captions.length;
  const local = frame - startFrame;
  const index = Math.min(
    captions.length - 1,
    Math.max(0, Math.floor(local / slice)),
  );
  const isLast = index === captions.length - 1;
  const phraseLocal = local - index * slice;

  if (frame < startFrame) return null;

  const words = captions[index]!.split(" ");
  const stagger = 4;

  // Phrase-level entrance and (for non-final phrases) exit.
  const enter = spring({ frame: phraseLocal, fps, config: { damping: 200 } });
  const exit = isLast
    ? 1
    : interpolate(phraseLocal, [slice - 8, slice], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const groupOpacity = Math.min(enter, exit);

  // Accent underline grows as the words land.
  const revealed = interpolate(
    phraseLocal,
    [0, words.length * stagger + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 2,
        left: 116,
        bottom: 128,
        maxWidth: 1400,
        display: "flex",
        alignItems: "stretch",
        gap: 28,
        opacity: groupOpacity,
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          width: 8,
          borderRadius: 8,
          background: `linear-gradient(${accent.bright}, ${accent.base})`,
          boxShadow: `0 0 24px ${accent.base}aa`,
          transform: `scaleY(${interpolate(enter, [0, 1], [0.2, 1])})`,
          transformOrigin: "bottom",
        }}
      />

      <div>
        {/* Scrim */}
        <div
          style={{
            position: "relative",
            padding: "13px 22px 18px 22px",
            borderRadius: 4,
            background: `${ibm.gray100}d9`,
            backdropFilter: "blur(10px)",
            border: `1px solid ${ibm.gray80}`,
          }}
        >
          <div
            style={{
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 52,
              lineHeight: 1.05,
              color: ibm.white,
              display: "flex",
              flexWrap: "wrap",
              gap: "0 15px",
            }}
          >
            {words.map((w, i) => {
              const wp = spring({
                frame: phraseLocal - i * stagger,
                fps,
                config: { damping: 200, stiffness: 120 },
              });
              return (
                <span
                  key={`${index}-${i}`}
                  style={{
                    display: "inline-block",
                    opacity: wp,
                    transform: `translateY(${interpolate(wp, [0, 1], [26, 0])}px)`,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>

          {/* Underline */}
          <div
            style={{
              marginTop: 10,
              height: 5,
              width: 160,
              borderRadius: 6,
              background: ibm.gray80,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${revealed * 100}%`,
                background: `linear-gradient(90deg, ${accent.base}, ${accent.bright})`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
