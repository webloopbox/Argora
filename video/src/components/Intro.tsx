import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { Bookend } from "../data/script";
import { ibm, sans } from "../theme/ibm";
import { Background } from "./Background";
import { Wordmark } from "./Wordmark";

export const Intro: React.FC<{ data: Bookend; hasAudio: boolean }> = ({
  data,
  hasAudio,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sub = spring({ frame: frame - 22, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center" }}
    >
      <Background accent={ibm.blue60} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Wordmark size={150} />
        <div
          style={{
            marginTop: 34,
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 46,
            color: ibm.gray30,
            opacity: sub,
            transform: `translateY(${interpolate(sub, [0, 1], [16, 0])}px)`,
            letterSpacing: 1,
          }}
        >
          {data.subtitle}
        </div>
      </div>
      {hasAudio ? <Audio src={staticFile(data.audio)} /> : null}
    </AbsoluteFill>
  );
};
