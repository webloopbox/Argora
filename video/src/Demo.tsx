import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { ibm } from "./theme/ibm";
import { intro, outro, steps, timeline } from "./data/script.mjs";
import type { Step } from "./data/script";
import { hasAudio } from "./data/audio-present.mjs";
import { sceneFrames } from "./timeline";
import { Intro } from "./components/Intro";
import { Outro } from "./components/Outro";
import { Scene } from "./components/Scene";
import { ProgressBar } from "./components/ProgressBar";

// Full film: intro → 10 demo steps → outro, stitched sequentially. Each scene's
// length comes from sceneFrames (aligned to the `timeline` order). The progress
// bar sits outside the Series so it reads the absolute frame.
export const Demo: React.FC = () => {
  const total = steps.length;

  return (
    <AbsoluteFill style={{ backgroundColor: ibm.gray100 }}>
      <Series>
        {timeline.map((item, i) => (
          <Series.Sequence key={item.id} durationInFrames={sceneFrames[i]!}>
            {item.kind === "intro" ? (
              <Intro data={intro} hasAudio={hasAudio(intro.id)} />
            ) : item.kind === "outro" ? (
              <Outro data={outro} hasAudio={hasAudio(outro.id)} />
            ) : (
              <Scene
                step={item as Step}
                total={total}
                durationInFrames={sceneFrames[i]!}
                hasAudio={hasAudio(item.id)}
              />
            )}
          </Series.Sequence>
        ))}
      </Series>
      <ProgressBar />
    </AbsoluteFill>
  );
};
