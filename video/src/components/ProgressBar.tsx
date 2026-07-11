import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ibm } from "../theme/ibm";

// Global progress bar. Rendered at the top level (outside the scene Series) so
// useCurrentFrame() reports the absolute composition frame.
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = Math.min(1, frame / durationInFrames);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 6,
        background: `${ibm.gray80}88`,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${p * 100}%`,
          background: `linear-gradient(90deg, ${ibm.blue60}, ${ibm.cyan40})`,
        }}
      />
    </div>
  );
};
