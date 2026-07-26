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
export default function WelcomePage() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-surface-inverse">
      <Lightfall />

      <main
        id="screen"
        className="relative mx-auto flex w-full max-w-(--ps-shell-max) flex-1 flex-col justify-end px-6 pb-10 pad-safe-top"
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

        <p className="mt-3 max-w-[22rem] t-title-2 font-normal text-ink-inverse/80">
          Male fertility, measured and explained.
        </p>

        <Link
          href="/start/consent"
          className="mt-8 flex min-h-(--ps-touch-min) w-full items-center justify-center gap-2 rounded-sm bg-accent px-4 py-3.5 t-body font-medium text-accent-ink"
        >
          Get started
          <Icon name="chevron-right" size={18} />
        </Link>

        <p className="mt-5 t-caption text-ink-inverse/55">{PROTOTYPE_DISCLAIMER}</p>

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
