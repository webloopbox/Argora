import type { LassoSelectionState } from "./useLassoSelection";

interface LassoOverlayProps {
  lasso: LassoSelectionState;
}

// Renders as a fixed SVG layer over the whole viewport so the polygon
// coordinates (screen-relative) stay stable regardless of canvas panning.
export function LassoOverlay({ lasso }: LassoOverlayProps) {
  if (lasso.polygon.length < 2) return null;

  const points = lasso.polygon.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 10 }}
    >
      <polyline
        points={points}
        fill="rgba(139, 92, 246, 0.08)"
        stroke="rgba(139, 92, 246, 0.65)"
        strokeWidth={2}
        strokeDasharray="6 4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {!lasso.drawing && lasso.polygon.length > 2 ? (
        <line
          x1={lasso.polygon[lasso.polygon.length - 1]!.x}
          y1={lasso.polygon[lasso.polygon.length - 1]!.y}
          x2={lasso.polygon[0]!.x}
          y2={lasso.polygon[0]!.y}
          stroke="rgba(139, 92, 246, 0.65)"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      ) : null}
    </svg>
  );
}
