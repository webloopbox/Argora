import { Config } from "@remotion/cli/config";

// Rendering defaults. Studio preview ignores most of these; they apply to
// `remotion render`. JPEG frames keep renders fast; H.264 is the safe codec
// for competition upload targets (YouTube, CapCut re-import, etc.).
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(null); // auto — one worker per core
