/**
 * PreSeed icon set.
 *
 * One 24px grid, 1.5px stroke, round caps, `currentColor` only. Icons are
 * decorative by default (`aria-hidden`) because every icon in this product
 * sits beside a text label — an icon is the *second* channel for meaning,
 * never the only one. See docs/design/accessibility.md#no-colour-only-meaning.
 */

export type IconName =
  | "today"
  | "results"
  | "protocol"
  | "evidence"
  | "account"
  | "chevron-right"
  | "chevron-left"
  | "chevron-down"
  | "check"
  | "check-circle"
  | "partial-circle"
  | "skip-circle"
  | "attention"
  | "escalation"
  | "info"
  | "unavailable"
  | "pending"
  | "simulated"
  | "lab"
  | "hand"
  | "upload"
  | "plus"
  | "coach"
  | "arrow-up"
  | "arrow-down"
  | "arrow-flat"
  | "external"
  | "lock"
  | "shield"
  | "close"
  | "pencil"
  | "calendar"
  | "target"
  | "phone"
  | "book"
  | "moon"
  | "camera"
  | "heart"
  | "pulse"
  | "food"
  | "grid"
  | "steps"
  | "help";

const paths: Record<IconName, React.ReactNode> = {
  // Horizon with a rising arc: the start of a day, not a sun cliché.
  today: (
    <>
      <path d="M3 18h18" />
      <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
      <path d="M12 5.5V7" />
      <path d="M5.6 8.1l1 1" />
      <path d="M18.4 8.1l-1 1" />
    </>
  ),
  // Bars with a reference band across them.
  results: (
    <>
      <path d="M4 20V11" />
      <path d="M10 20V5" />
      <path d="M16 20v-6" />
      <path d="M3 16h18" strokeDasharray="2.5 2.5" />
      <path d="M21 20V8" />
    </>
  ),
  protocol: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3" />
      <path d="M16 3v3" />
      <path d="M8.5 14.5l2 2 4-4" />
    </>
  ),
  evidence: (
    <>
      <path d="M5 4.5h9l5 5v10a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-14A1.5 1.5 0 0 1 6.5 4.5Z" />
      <path d="M13.5 4.5V10h5.5" />
      <path d="M8.5 14h7" />
      <path d="M8.5 17.5h4.5" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  "chevron-right": <path d="M9.5 5.5l6.5 6.5-6.5 6.5" />,
  "chevron-left": <path d="M14.5 5.5L8 12l6.5 6.5" />,
  "chevron-down": <path d="M5.5 9.5L12 16l6.5-6.5" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </>
  ),
  // Half-filled: partially completed. Shape, not colour, carries the state.
  "partial-circle": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" />
    </>
  ),
  "skip-circle": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12h7" />
    </>
  ),
  attention: (
    <>
      <path d="M12 4.5 21 19.5H3L12 4.5Z" />
      <path d="M12 10v3.5" />
      <path d="M12 16.5v.01" />
    </>
  ),
  escalation: (
    <>
      <path d="M8.6 3.5h6.8l4.1 4.1v6.8l-4.1 4.1H8.6L4.5 14.4V7.6L8.6 3.5Z" />
      <path d="M12 8v4" />
      <path d="M12 15v.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <path d="M12 7.8v.01" />
    </>
  ),
  unavailable: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6.5 17.5 17.5 6.5" />
    </>
  ),
  pending: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  // Specimen vial: the honest signal for simulated data.
  simulated: (
    <>
      <path d="M9 3.5h6" />
      <path d="M10 3.5v11a2 2 0 0 0 4 0v-11" />
      <path d="M10 11.5h4" strokeDasharray="1.5 1.5" />
      <path d="M12 18.5v2" />
    </>
  ),
  lab: (
    <>
      <path d="M4 20.5V6.5l8-3 8 3v14" />
      <path d="M3 20.5h18" />
      <path d="M9.5 20.5v-5h5v5" />
      <path d="M9.5 10.5h5" />
    </>
  ),
  hand: (
    <>
      <path d="M8.5 11V5.8a1.6 1.6 0 0 1 3.2 0V11" />
      <path d="M11.7 11V7.3a1.6 1.6 0 0 1 3.2 0V13" />
      <path d="M14.9 12.4a1.6 1.6 0 0 1 3.2 0v2.2a6 6 0 0 1-6 6h-1a5 5 0 0 1-5-5v-3.4a1.6 1.6 0 0 1 3.2 0" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4.5" />
      <path d="M7.5 9 12 4.5 16.5 9" />
      <path d="M4.5 15v3.5A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 2-2V15" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </>
  ),
  // Four rays around a reading point: an explanation, not a magic wand.
  coach: (
    <>
      <path d="M12 6.5v-3" />
      <path d="M12 20.5v-3" />
      <path d="M6.5 12h-3" />
      <path d="M20.5 12h-3" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  "arrow-up": (
    <>
      <path d="M12 19V5.5" />
      <path d="M6.5 11 12 5.5 17.5 11" />
    </>
  ),
  "arrow-down": (
    <>
      <path d="M12 5v13.5" />
      <path d="M6.5 13 12 18.5 17.5 13" />
    </>
  ),
  "arrow-flat": (
    <>
      <path d="M4.5 12h15" />
      <path d="M14.5 7.5 19.5 12l-5 4.5" />
    </>
  ),
  external: (
    <>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
      <path d="M17 14.5v4a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 6 7.5h4" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.5v2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19.5 6v6.2c0 4-3.1 7.2-7.5 8.3-4.4-1.1-7.5-4.3-7.5-8.3V6L12 3.5Z" />
      <path d="M9 12.2l2.2 2.3L15.5 10" />
    </>
  ),
  close: (
    <>
      <path d="M6.5 6.5l11 11" />
      <path d="M17.5 6.5l-11 11" />
    </>
  ),
  pencil: (
    <>
      <path d="M4.5 19.5h4L19 9a2.1 2.1 0 0 0-3-3L5.5 16.5v3Z" />
      <path d="M14.5 7.5 17.5 10.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3" />
      <path d="M16 3v3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 12h.01" />
    </>
  ),
  phone: (
    <>
      <path d="M7.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 5.5 5.5a2 2 0 0 1 2-2Z" />
    </>
  ),
  book: (
    <>
      <path d="M4.5 5.5A2 2 0 0 1 6.5 3.5H19v14H6.5a2 2 0 0 0-2 2v-14Z" />
      <path d="M4.5 19.5a2 2 0 0 1 2-2H19v3H6.5a2 2 0 0 1-2-1Z" />
      <path d="M8.5 8h7" />
    </>
  ),
  // Crescent only. No stars, no face — this labels a measurement, not a mood.
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  camera: (
    <>
      <path d="M3.5 8.5A2 2 0 0 1 5.5 6.5h2l1.5-2.5h6l1.5 2.5h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.7-7.5-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.5 2.4C19.5 15.3 12 20 12 20Z" />
  ),
  pulse: <path d="M2.5 12.5h4l2.5-6 4 12 2.5-6h6" />,
  food: (
    <>
      <path d="M6 3.5v8a2.5 2.5 0 0 0 5 0v-8" />
      <path d="M8.5 11.5V20.5" />
      <path d="M17 3.5c-1.5 1.5-2 3.5-2 5.5s.7 3 2 3 2-1 2-3-.5-4-2-5.5Z" />
      <path d="M17 12v8.5" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  steps: (
    <>
      <path d="M7.5 20.5c-1.5 0-2.5-1-2.5-2.5s.5-2 .5-3.5-1-2.5-1-4.5a3 3 0 0 1 6 0c0 2-1 3-1 4.5s.5 2 .5 3.5-1 2.5-2.5 2.5Z" />
      <path d="M16.5 14.5c-1.5 0-2.5-1-2.5-2.5s.5-2 .5-3.5-1-2.5-1-4.5a3 3 0 0 1 6 0c0 2-1 3-1 4.5s.5 2 .5 3.5-1 2.5-2.5 2.5Z" />
    </>
  ),
  // Question mark in a circle. Opens the explanation for a marker.
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.5 2.5 0 0 1 4.85.85c0 1.7-2.45 2.25-2.45 3.75" />
      <path d="M12 17.2h.01" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  label,
}: {
  name: IconName;
  size?: number;
  className?: string;
  /** Supply only when the icon is the sole content of a control. */
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      focusable="false"
    >
      {label ? <title>{label}</title> : null}
      {paths[name]}
    </svg>
  );
}
