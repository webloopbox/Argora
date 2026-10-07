import { useCallback, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { NODE_HEIGHT, NODE_WIDTH, THESIS_NODE_ID } from "./graph-metrics";

interface Point {
  x: number;
  y: number;
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.x;
    const yi = polygon[i]!.y;
    const xj = polygon[j]!.x;
    const yj = polygon[j]!.y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export interface LassoSelectionState {
  drawing: boolean;
  polygon: Point[];
}

export interface UseLassoSelection {
  lasso: LassoSelectionState;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  reset: () => void;
}

const IDLE: LassoSelectionState = { drawing: false, polygon: [] };

/**
 * Freehand selection over the React Flow canvas.
 *
 * The gesture is accumulated in a ref and only mirrored into state for the
 * overlay to draw: a pointer stream fires far more often than React can
 * commit, and pointer-up must hit-test the points actually captured, not the
 * ones that happened to be rendered. The viewport is read on demand through
 * `getViewport()` rather than subscribed to with `useViewport()`, so panning
 * and zooming do not re-render the whole graph while no lasso is in progress.
 */
export function useLassoSelection(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onComplete: (argumentIds: string[]) => void,
): UseLassoSelection {
  const { getNodes, getViewport } = useReactFlow();
  const [lasso, setLasso] = useState<LassoSelectionState>(IDLE);
  const gestureRef = useRef<LassoSelectionState>(IDLE);

  const getRelativePoint = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): Point => {
      const rect = containerRef.current?.getBoundingClientRect();
      return {
        x: e.clientX - (rect?.left ?? 0),
        y: e.clientY - (rect?.top ?? 0),
      };
    },
    [containerRef],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      gestureRef.current = { drawing: true, polygon: [getRelativePoint(e)] };
      setLasso(gestureRef.current);
    },
    [getRelativePoint],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!gestureRef.current.drawing) return;
      gestureRef.current = {
        drawing: true,
        polygon: [...gestureRef.current.polygon, getRelativePoint(e)],
      };
      setLasso(gestureRef.current);
    },
    [getRelativePoint],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore - capture may already be released */
      }

      const gesture = gestureRef.current;
      if (!gesture.drawing) return;
      gestureRef.current = IDLE;
      setLasso(IDLE);

      // Screen points captured during the drag are mapped into canvas space in
      // one pass, against the viewport in force when the gesture ended.
      const { x: vpX, y: vpY, zoom } = getViewport();
      const flowPolygon = gesture.polygon.map((p) => ({
        x: (p.x - vpX) / zoom,
        y: (p.y - vpY) / zoom,
      }));

      const selectedIds = getNodes()
        .filter((n) => n.type !== THESIS_NODE_ID)
        .filter((n) =>
          pointInPolygon(
            {
              x: n.position.x + NODE_WIDTH / 2,
              y: n.position.y + NODE_HEIGHT / 2,
            },
            flowPolygon,
          ),
        )
        .map((n) => n.id);

      onComplete(selectedIds);
    },
    [getNodes, getViewport, onComplete],
  );

  const reset = useCallback(() => {
    gestureRef.current = IDLE;
    setLasso(IDLE);
  }, []);

  return { lasso, onPointerDown, onPointerMove, onPointerUp, reset };
}
