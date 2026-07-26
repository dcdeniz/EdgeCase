"use client";

/**
 * Protocol day ring.
 *
 * The day count and the arc animate up on mount, which gives the protocol a
 * sense of distance travelled that a static bar does not.
 *
 * Motion is a preference, not a decoration. `prefers-reduced-motion` and the
 * in-app `data-motion="reduced"` setting both skip straight to the final
 * value — the design system collapses every duration to 1ms under those, and
 * a number counting up would otherwise ignore that entirely. The rendered
 * figure is identical either way; only the travel changes.
 */

import { useEffect, useRef, useState } from "react";

export function ProtocolRing({
  day,
  total,
  size = 168,
}: {
  day: number;
  total: number;
  size?: number;
}) {
  const [shown, setShown] = useState(day);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-motion") === "reduced";

    // State already holds the final value, so reduced motion is simply no-op.
    if (reduced) return;

    const duration = 900;
    const started = performance.now();

    // The first frame writes ~0; nothing is set synchronously in the effect.
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      // Ease-out cubic, so it decelerates into the final figure.
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(eased * day));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [day]);

  const stroke = Math.max(9, Math.round(size * 0.07));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, shown / total));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="meter"
        aria-valuenow={day}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuetext={`Day ${day} of ${total}`}
        aria-label="Protocol progress"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ps-accent)"
          strokeOpacity={0.2}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ps-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="t-micro text-ink-3">Day</span>
        <span
          className="text-ink-1 ps-num"
          style={{
            fontSize: `${Math.round(size * 0.3)}px`,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontWeight: 500,
          }}
        >
          {shown}
        </span>
        <span className="mt-0.5 t-caption text-ink-3">of {total}</span>
      </div>
    </div>
  );
}
