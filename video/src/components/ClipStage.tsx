import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { ibm } from "../theme/ibm";
import type { Accent } from "../theme/ibm";
import type { ClipSegment } from "../data/script";
import { PlaceholderClip } from "./PlaceholderClip";

// A floating, rounded panel that hosts the screen recording (or placeholder).
// The panel is locked to the clip's 16:9 aspect so the recording is never
// cropped (no Ken Burns / cover-crop — the app header must stay visible).
// An accent "wipe" reveals it on entrance so each cut feels designed rather
// than abrupt. Overlays (step chip, captions) are drawn on top by the parent
// Scene.
//
// When `segments` is given, the source clip plays as a speed ramp: each
// segment maps [from..to] seconds of the source to a Series.Sequence at its
// own playbackRate (used to timelapse long AI-processing waits).
export const ClipStage: React.FC<{
  index: number;
  tag: string;
  clip: string | null;
  hasClip: boolean;
  accent: Accent;
  segments?: ClipSegment[];
}> = ({ index, tag, clip, hasClip, accent, segments }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 } });
  const scale = interpolate(enter, [0, 1], [0.965, 1]);
  const opacity = enter;

  // Accent wipe sweeps across in the first ~14 frames.
  const wipe = interpolate(frame, [0, 14], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    // The panel matches the clip's aspect ratio, so this never crops.
    objectFit: "contain",
  };

  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", padding: 84 }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          height: "100%",
          maxWidth: "100%",
          transform: `scale(${scale})`,
          opacity,
          borderRadius: 18,
          overflow: "hidden",
          background: ibm.gray90,
          boxShadow: `0 40px 120px ${ibm.black}bb, 0 0 0 1px ${ibm.gray80}`,
        }}
      >
        <AbsoluteFill>
          {hasClip && clip ? (
            segments && segments.length > 0 ? (
              <Series>
                {segments.map((seg, i) => (
                  <Series.Sequence
                    key={i}
                    durationInFrames={Math.max(
                      1,
                      Math.round(((seg.to - seg.from) / seg.rate) * fps),
                    )}
                    layout="none"
                  >
                    <AbsoluteFill>
                      <OffthreadVideo
                        src={staticFile(clip)}
                        startFrom={Math.round(seg.from * fps)}
                        playbackRate={seg.rate}
                        muted
                        style={videoStyle}
                      />
                    </AbsoluteFill>
                  </Series.Sequence>
                ))}
              </Series>
            ) : (
              <OffthreadVideo src={staticFile(clip)} muted style={videoStyle} />
            )
          ) : (
            <PlaceholderClip index={index} tag={tag} clip={clip} accent={accent} />
          )}
        </AbsoluteFill>

        {/* Entrance wipe */}
        <AbsoluteFill
          style={{ background: accent.base, transform: `translateX(${wipe}%)` }}
        />
      </div>
    </AbsoluteFill>
  );
};
