"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { Lightfall } from "@/components/lightfall";
import { PROTOTYPE_DISCLAIMER } from "@/components/shell";

/**
 * Splash.
 *
 * One screen, full bleed, three things: the name, a line, a way in. The
 * reasoning-chain specimen that used to live here moved out — a landing page
 * that argues the product's epistemology before anyone has asked is a
 * brochure, not a front door. The argument survives where it belongs, on the
 * screens that carry a real result.
 *
 * The prototype disclaimer stays. It is the one thing that cannot wait for a
 * later screen.
 */
/** Module scope: a new array each render would rebuild the WebGL context. */
const LIGHTFALL_COLOURS = ["#f4f1ea", "#4fc2b5", "#c9a15f"];

export default function WelcomePage() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-surface-inverse">
      {/*
        Cream and teal on a deep warm ground. The splash is the only dark
        screen in the product, so its streaks are the colour of the cream
        surface the user is about to enter — it reads as a doorway into the
        app rather than as a different product.
      */}
      <Lightfall
        colors={LIGHTFALL_COLOURS}
        backgroundColor="#0d1a17"
        speed={0.4}
        streakCount={3}
      />

      <main
        id="screen"
        className="relative mx-auto flex w-full max-w-(--ps-shell-max) flex-1 flex-col items-center justify-center px-6 py-10 text-center pad-safe-top"
      >
        <h1
          className="text-ink-inverse"
          style={{
            fontSize: "3.25rem",
            lineHeight: 1,
            letterSpacing: "-0.035em",
            fontWeight: 600,
          }}
        >
          PreSeed
        </h1>

        <p className="mt-3 max-w-[19rem] t-title-2 font-normal text-ink-inverse/80">
          Male fertility, measured and explained.
        </p>

        <Link
          href="/start/consent"
          className="mt-9 flex min-h-(--ps-touch-min) w-full max-w-[19rem] items-center justify-center gap-2 rounded-sm bg-accent px-4 py-3.5 t-body font-medium text-accent-ink"
        >
          Get started
          <Icon name="chevron-right" size={18} />
        </Link>

        <p className="mt-6 max-w-[21rem] t-caption text-ink-inverse/55">{PROTOTYPE_DISCLAIMER}</p>

        <Link
          href="/prototype"
          className="mt-4 inline-flex items-center gap-1 t-caption text-ink-inverse/70 underline underline-offset-2"
        >
          Screen map
        </Link>
      </main>
    </div>
  );
}
