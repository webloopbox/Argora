import React from "react";
import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { ibm, sans } from "../theme/ibm";
import { BRAND } from "../data/script.mjs";

// The Argora wordmark with a small argument-graph glyph: a root node
// with one green (support) and one red (challenge) child — a 3-second visual
// summary of the whole product. Animates the edges drawing in, then nodes pop.
export const Wordmark: React.FC<{ size?: number; delay?: number }> = ({
  size = 120,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });

  const glyph = size * 1.15;
  const draw = interpolate(p, [0, 1], [0, 1]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.42 }}>
      <GraphGlyph s={glyph} draw={draw} />
      <div
        style={{
          fontFamily: sans,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: -size * 0.02,
          color: ibm.white,
          transform: `translateX(${interpolate(p, [0, 1], [24, 0])}px)`,
          opacity: p,
        }}
      >
        {BRAND}
      </div>
    </div>
  );
};

const GraphGlyph: React.FC<{ s: number; draw: number }> = ({ s, draw }) => {
  // Coordinates in a 100x100 viewbox.
  const root = { x: 50, y: 20 };
  const left = { x: 24, y: 78 };
  const right = { x: 76, y: 78 };
  const edge = (a: typeof root, b: typeof root) => {
    const x = a.x + (b.x - a.x) * draw;
    const y = a.y + (b.y - a.y) * draw;
    return { x2: x, y2: y };
  };
  const l = edge(root, left);
  const r = edge(root, right);
  const nodePop = Math.max(0, (draw - 0.7) / 0.3);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 100 100"
      style={{ width: s, height: s, flexShrink: 0, overflow: "visible" }}
    >
      <line x1={root.x} y1={root.y} x2={l.x2} y2={l.y2} stroke={ibm.green50} strokeWidth={5} strokeLinecap="round" />
      <line x1={root.x} y1={root.y} x2={r.x2} y2={r.y2} stroke={ibm.red60} strokeWidth={5} strokeLinecap="round" />
      <circle cx={root.x} cy={root.y} r={12} fill={ibm.blue60} />
      <circle cx={left.x} cy={left.y} r={10 * nodePop} fill={ibm.green50} />
      <circle cx={right.x} cy={right.y} r={10 * nodePop} fill={ibm.red60} />
    </svg>
  );
};
