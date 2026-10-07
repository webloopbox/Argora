import { useEffect, useState } from "react";

/**
 * Subscribes to a CSS media query from JS. Use it only when the markup itself
 * has to differ (a drawer that slides in from the side on desktop and from the
 * bottom on a phone); plain Tailwind breakpoints remain the default for styling.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
