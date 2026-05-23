import { useCallback, useEffect, useRef } from "react";

interface TypewriterOptions {
  /** Characters revealed per tick. Default 3 - feels fast but still legible. */
  charsPerTick?: number;
  /** Tick interval in ms. Default 16 (~60fps). */
  tickMs?: number;
}

/**
 * Animates a string into a state setter, character by character. Use for
 * AI-generated content so the result feels live-streamed even though the
 * backend returned the whole payload at once. Cancel on unmount or before
 * starting a new animation; an optional `onDone` callback fires at the end.
 */
export function useTypewriter(
  setter: (value: string) => void,
  options: TypewriterOptions = {},
) {
  const { charsPerTick = 3, tickMs = 16 } = options;
  const intervalRef = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const animate = useCallback(
    (fullText: string, onDone?: () => void) => {
      cancel();
      if (!fullText) {
        setter("");
        onDone?.();
        return;
      }
      let i = 0;
      setter("");
      intervalRef.current = window.setInterval(() => {
        i = Math.min(i + charsPerTick, fullText.length);
        setter(fullText.slice(0, i));
        if (i >= fullText.length) {
          cancel();
          onDone?.();
        }
      }, tickMs);
    },
    [cancel, setter, charsPerTick, tickMs],
  );

  useEffect(() => cancel, [cancel]);

  return { animate, cancel };
}
