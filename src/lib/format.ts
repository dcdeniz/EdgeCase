import { markerCatalogue, type MarkerCode, type MarkerValue } from "@/lib/clinical";

/** The prototype's fixed "today", so the demo narrative stays reproducible. */
export const TODAY = "2026-07-25";

export function parseDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

export function daysBetween(fromIso: string, toIso: string) {
  const ms = parseDate(toIso).getTime() - parseDate(fromIso).getTime();
  return Math.round(ms / 86_400_000);
}

export function addDays(iso: string, days: number) {
  const date = parseDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

export function formatDate(iso: string) {
  return longDate.format(parseDate(iso));
}

export function formatDateShort(iso: string) {
  return shortDate.format(parseDate(iso));
}

export function formatWeekday(iso: string) {
  return weekday.format(parseDate(iso));
}

export function relativeDays(iso: string, from = TODAY) {
  const days = daysBetween(iso, from);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days === -1) return "tomorrow";
  if (days > 0) return `${days} days ago`;
  return `in ${Math.abs(days)} days`;
}

export function formatNumber(value: number, decimals: number) {
  return value.toFixed(decimals);
}

export function formatMarker(marker: MarkerValue) {
  const definition = markerCatalogue[marker.code];
  return formatNumber(marker.value, definition.decimals);
}

/** Screen-reader text for a measured value, with a speakable unit. */
export function spokenMarker(marker: MarkerValue) {
  const definition = markerCatalogue[marker.code];
  return `${definition.label}, ${formatMarker(marker)} ${definition.unitSpoken}`;
}

export type Delta = {
  absolute: number;
  percent: number | null;
  direction: "up" | "down" | "flat";
};

export function computeDelta(from: number, to: number): Delta {
  const absolute = to - from;
  const percent = from === 0 ? null : (absolute / from) * 100;
  const direction = absolute === 0 ? "flat" : absolute > 0 ? "up" : "down";
  return { absolute, percent, direction };
}

export function formatDelta(delta: Delta, decimals: number) {
  const sign = delta.direction === "up" ? "+" : delta.direction === "down" ? "−" : "";
  return `${sign}${formatNumber(Math.abs(delta.absolute), decimals)}`;
}

export function formatPercentDelta(delta: Delta) {
  if (delta.percent == null) return "—";
  const sign = delta.direction === "up" ? "+" : delta.direction === "down" ? "−" : "";
  return `${sign}${Math.abs(delta.percent).toFixed(0)}%`;
}

export const directionWord: Record<Delta["direction"], string> = {
  up: "higher",
  down: "lower",
  flat: "unchanged",
};

export function markerLabel(code: MarkerCode) {
  return markerCatalogue[code].label;
}
