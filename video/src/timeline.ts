import { FPS, timeline } from "./data/script.mjs";

// Fixed, hand-tuned timing (see each scene's `seconds` in script.mjs). Both the
// composition duration and the per-scene Series lengths derive from here, so
// they can never disagree. Nudge a scene's `seconds` to fine-tune pacing.
export const secToFrames = (s: number): number => Math.round(s * FPS);

export const sceneFrames: number[] = timeline.map((t) => secToFrames(t.seconds));

export const totalFrames: number = sceneFrames.reduce((a, b) => a + b, 0);
