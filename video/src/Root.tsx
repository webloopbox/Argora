import React from "react";
import { Composition } from "remotion";
import { FPS, WIDTH, HEIGHT } from "./data/script.mjs";
import { totalFrames } from "./timeline";
import { Demo } from "./Demo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BrainstormDemo"
      component={Demo}
      durationInFrames={totalFrames}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
