import { useEffect } from "react";
import { ui } from "../texts/ui";

// Sets `document.title` for the lifetime of the calling component and
// restores it on unmount. Pass `null` to keep the default app title (e.g. on
// pages still loading their primary content).
export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — ${ui.app.name}` : ui.app.name;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
