import { useCallback, useRef, useState } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";

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
  containerRef: React.RefObject<HTMLDivElement | null>;
  lasso: LassoSelectionState;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  reset: () => void;
}

export function useLassoSelection(
  onComplete: (argumentIds: string[]) => void,
): UseLassoSelection {
  const containerRef = useRef<HTMLDivElement>(null);
  const { getNodes } = useReactFlow();
  const viewport = useViewport();
  const [lasso, setLasso] = useState<LassoSelectionState>({
    drawing: false,
    polygon: [],
  });

  const getRelativePoint = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): Point => {
      const rect = containerRef.current?.getBoundingClientRect();
      return {
        x: e.clientX - (rect?.left ?? 0),
        y: e.clientY - (rect?.top ?? 0),
      };
    },
    [],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      const pt = getRelativePoint(e);
      setLasso({ drawing: true, polygon: [pt] });
    },
    [getRelativePoint],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!lasso.drawing) return;
      const pt = getRelativePoint(e);
      setLasso((prev) => ({
        ...prev,
        polygon: [...prev.polygon, pt],
      }));
    },
    [lasso.drawing, getRelativePoint],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!lasso.drawing) return;
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

      // Container-relative coords → flow coords
      const { x: vpX, y: vpY, zoom } = viewport;
      const flowPolygon = lasso.polygon.map((p) => ({
        x: (p.x - vpX) / zoom,
        y: (p.y - vpY) / zoom,
      }));

      const NODE_W = 300;
      const NODE_H = 150;

      const selectedIds = getNodes()
        .filter((n) => n.type !== "thesis")
        .filter((n) => {
          const center = {
            x: n.position.x + NODE_W / 2,
            y: n.position.y + NODE_H / 2,
          };
          return pointInPolygon(center, flowPolygon);
        })
        .map((n) => n.id);

      setLasso({ drawing: false, polygon: [] });
      onComplete(selectedIds);
    },
    [lasso, viewport, getNodes, onComplete],
  );

  const reset = useCallback(() => {
    setLasso({ drawing: false, polygon: [] });
  }, []);

  return { containerRef, lasso, onPointerDown, onPointerMove, onPointerUp, reset };
}
