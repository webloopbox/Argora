import { loadFont as loadSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import type { AccentKey } from "../data/script";

// IBM Plex is the official IBM typeface — loading it is what makes the piece
// read as authentically "IBM" rather than generic. Remotion delays the render
// until the fonts are ready, so using `family` immediately is safe.
export const { fontFamily: sans } = loadSans("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});
export const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});

// IBM Carbon Design System color tokens.
// https://carbondesignsystem.com/elements/color/tokens
export const ibm = {
  // Neutrals (Gray)
  black: "#000000",
  gray100: "#161616",
  gray90: "#262626",
  gray80: "#393939",
  gray70: "#525252",
  gray50: "#8d8d8d",
  gray30: "#c6c6c6",
  gray20: "#e0e0e0",
  gray10: "#f4f4f4",
  white: "#ffffff",

  // Brand blue — the load-bearing IBM color.
  blue80: "#002d9c",
  blue70: "#0043ce",
  blue60: "#0f62fe",
  blue50: "#4589ff",
  blue40: "#78a9ff",

  // Supporting accents
  cyan40: "#33b1ff",
  cyan30: "#82cfff",
  teal40: "#08bdba",
  teal30: "#3ddbd9",
  purple60: "#8a3ffc",
  purple40: "#be95ff",
  magenta50: "#ee5396",
  magenta40: "#ff7eb6",

  // Semantic (used only if we ever mirror in-app pro/against — kept here for
  // reference; the video chrome deliberately avoids these two).
  green50: "#24a148",
  red60: "#da1e28",
} as const;

export interface Accent {
  base: string;
  bright: string;
  soft: string;
}

// Chrome accents per scene. Intentionally excludes green/red so the video's
// decorative color never collides with the app's load-bearing pro/against
// coding that appears inside the footage.
export const ACCENTS: Record<AccentKey, Accent> = {
  blue: { base: ibm.blue60, bright: ibm.blue40, soft: ibm.blue80 },
  cyan: { base: ibm.cyan40, bright: ibm.cyan30, soft: ibm.blue80 },
  purple: { base: ibm.purple60, bright: ibm.purple40, soft: "#31135e" },
  teal: { base: ibm.teal40, bright: ibm.teal30, soft: "#022b30" },
  magenta: { base: ibm.magenta50, bright: ibm.magenta40, soft: "#510224" },
};

export const getAccent = (key: AccentKey): Accent => ACCENTS[key] ?? ACCENTS.blue;
