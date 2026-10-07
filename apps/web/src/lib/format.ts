import type { Lang } from "../texts/ui";

// Presentation helpers shared by every view that prints a date, a relative
// timestamp or an avatar monogram. `Intl.*Format` construction is the
// expensive part, so instances are built once per locale and reused - the
// formatters are stateless, so a module-level cache is safe.

const LOCALES: Record<Lang, string> = { pl: "pl-PL", en: "en-US" };

const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>();

function dateFormatter(lang: Lang): Intl.DateTimeFormat {
  const locale = LOCALES[lang];
  let formatter = dateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    dateFormatters.set(locale, formatter);
  }
  return formatter;
}

function relativeFormatter(lang: Lang): Intl.RelativeTimeFormat {
  const locale = LOCALES[lang];
  let formatter = relativeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    relativeFormatters.set(locale, formatter);
  }
  return formatter;
}

/** Long-form calendar date ("7 października 2026") for an ISO timestamp. */
export function formatDate(iso: string, lang: Lang): string {
  return dateFormatter(lang).format(new Date(iso));
}

const RELATIVE_UNITS: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3_600, divisor: 60, unit: "minute" },
  { limit: 86_400, divisor: 3_600, unit: "hour" },
  { limit: 604_800, divisor: 86_400, unit: "day" },
];

/** "3 hours ago" / "3 godziny temu" for an ISO timestamp, weeks being the coarsest unit. */
export function formatRelative(iso: string, lang: Lang): string {
  const formatter = relativeFormatter(lang);
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  const match = RELATIVE_UNITS.find((u) => abs < u.limit);
  return match
    ? formatter.format(Math.round(diffSeconds / match.divisor), match.unit)
    : formatter.format(Math.round(diffSeconds / 604_800), "week");
}

/** Up to two uppercase initials for an avatar fallback; empty for a missing name. */
export function initialsFor(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}
