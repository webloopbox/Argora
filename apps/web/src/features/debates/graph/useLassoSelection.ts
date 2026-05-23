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
  lasso: LassoSelectionState;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  reset: () => void;
}

export function useLassoSelection(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onComplete: (argumentIds: string[]) => void,
): UseLassoSelection {
  const { getNodes } = useReactFlow();
  const viewport = useViewport();
  const [lasso, setLasso] = useState<LassoSelectionState>({
    drawing: false,
    polygon: [],
  });

  // Latest viewport mirrored in a ref so the pointerUp callback can read it
  // without forcing re-creation of the handler each viewport change.
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

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
      const pt = getRelativePoint(e);
      setLasso({ drawing: true, polygon: [pt] });
    },
    [getRelativePoint],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setLasso((prev) => {
        if (!prev.drawing) return prev;
        const pt = {
          x:
            e.clientX -
            (containerRef.current?.getBoundingClientRect().left ?? 0),
          y:
            e.clientY -
            (containerRef.current?.getBoundingClientRect().top ?? 0),
        };
        return { ...prev, polygon: [...prev.polygon, pt] };
      });
    },
    [containerRef],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore - capture may already be released */
      }

      setLasso((prev) => {
        if (!prev.drawing) return prev;

        const { x: vpX, y: vpY, zoom } = viewportRef.current;
        const flowPolygon = prev.polygon.map((p) => ({
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

        onComplete(selectedIds);
        return { drawing: false, polygon: [] };
      });
    },
    [getNodes, onComplete],
  );

  const reset = useCallback(() => {
    setLasso({ drawing: false, polygon: [] });
  }, []);

  return { lasso, onPointerDown, onPointerMove, onPointerUp, reset };
}
