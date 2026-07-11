// Types for the plain-JS single source of truth in script.mjs.

export type AccentKey =
  | "blue"
  | "cyan"
  | "purple"
  | "teal"
  | "magenta";

export interface ClipSegment {
  /** Source-clip start, in seconds. */
  from: number;
  /** Source-clip end, in seconds. */
  to: number;
  /** Playback speed; 1 = realtime, 20 = timelapse. */
  rate: number;
}

export interface Step {
  id: string;
  index: number;
  kind: "step";
  tag: string;
  clip: string | null;
  audio: string;
  seconds: number;
  accent: AccentKey;
  captions: string[];
  narration: string;
  /** Optional speed-ramped playback of the source clip. */
  segments?: ClipSegment[];
}

export interface Bookend {
  id: string;
  kind: "intro" | "outro";
  title: string;
  subtitle: string;
  audio: string;
  seconds: number;
  narration: string;
}

export type TimelineItem = Step | Bookend;

export const FPS: number;
export const WIDTH: number;
export const HEIGHT: number;
export const PAD_AFTER_AUDIO: number;
export const BRAND: string;
export const DOMAIN: string;
export const intro: Bookend;
export const outro: Bookend;
export const steps: Step[];
export const timeline: TimelineItem[];
export const narrated: TimelineItem[];
