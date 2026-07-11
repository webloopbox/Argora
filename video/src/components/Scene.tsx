import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import type { Step } from "../data/script";
import { getAccent } from "../theme/ibm";
import { hasClip } from "../data/clips-present.mjs";
import { Background } from "./Background";
import { ClipStage } from "./ClipStage";
import { StepChip } from "./StepChip";
import { AnimatedCaption } from "./AnimatedCaption";

// One demo step: background, the recording in a window frame, the step chip,
// animated captions, and the voiceover line (if generated).
export const Scene: React.FC<{
  step: Step;
  total: number;
  durationInFrames: number;
  hasAudio: boolean;
}> = ({ step, total, durationInFrames, hasAudio }) => {
  const accent = getAccent(step.accent);
  const present = hasClip(step.id);

  return (
    <AbsoluteFill>
      <Background accent={accent.base} />
      <ClipStage
        index={step.index}
        tag={step.tag}
        clip={step.clip}
        hasClip={present}
        accent={accent}
        segments={step.segments}
      />
      <StepChip index={step.index} total={total} tag={step.tag} accent={accent} />
      <AnimatedCaption
        captions={step.captions}
        accent={accent}
        durationInFrames={durationInFrames}
      />
      {hasAudio ? <Audio src={staticFile(step.audio)} /> : null}
    </AbsoluteFill>
  );
};
