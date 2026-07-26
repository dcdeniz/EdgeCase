"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import {
  Announcer,
  Button,
  Card,
  Sheet,
  StatusChip,
  cx,
} from "@/components/ui";
import { usePrototype, type Track } from "@/lib/store";

export const PROTOTYPE_DISCLAIMER =
  "This is a research prototype using simulated test data. Not a medical device. Consult a clinician for real testing and before making significant lifestyle or supplement changes.";

/* ==========================================================================
   Navigation
   --------------------------------------------------------------------------
   Five stable destinations. The third adapts to the selected track, because a
   man tracking reversal recovery and a man preserving before treatment are not
   both following a 100-day protocol.
   ========================================================================== */

type Destination = { href: string; label: string; glyph: IconName; match: string };

/*
 * Five destinations still. "Ask" takes the Evidence slot rather than becoming a
 * sixth tab — the library is reachable from every evidence citation and from
 * the Ask screen itself, whereas a what-if question has no other entry point.
 */
const baseDestinations: Destination[] = [
  { href: "/today", label: "Today", glyph: "today", match: "/today" },
  { href: "/results", label: "Results", glyph: "results", match: "/results" },
  { href: "/protocol", label: "Protocol", glyph: "protocol", match: "/protocol" },
  { href: "/ask", label: "Ask", glyph: "coach", match: "/ask" },
  { href: "/account", label: "Account", glyph: "account", match: "/account" },
];

export function destinationsForTrack(track: Track | null): Destination[] {
  if (track === "vasectomy_reversal") {
    return baseDestinations.map((destination) =>
      destination.match === "/protocol"
        ? { href: "/reversal", label: "Tracking", glyph: "results", match: "/reversal" }
        : destination,
    );
  }
  if (track === "pre_treatment_preservation") {
    return baseDestinations.map((destination) =>
      destination.match === "/protocol"
        ? { href: "/preservation", label: "Priority", glyph: "target", match: "/preservation" }
        : destination,
    );
  }
  return baseDestinations;
}

function BottomNav() {
  const pathname = usePathname();
  const { state } = usePrototype();
  const destinations = destinationsForTrack(state.track);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface-1/95 backdrop-blur-md pad-safe-bottom"
    >
      <ul className="mx-auto flex max-w-(--ps-shell-max) items-stretch">
        {destinations.map((destination) => {
          const active = pathname === destination.match || pathname.startsWith(`${destination.match}/`);
          return (
            <li key={destination.href} className="flex-1">
              <Link
                href={destination.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-(--ps-nav-height) flex-col items-center justify-center gap-1 px-1 py-2",
                  "transition-colors duration-(--ps-duration-fast)",
                  active ? "text-accent" : "text-ink-3 hover:text-ink-2",
                )}
              >
                <span className="relative">
                  <Icon name={destination.glyph} size={22} />
                  {/* Position, not colour, marks the active tab for forced-colors users. */}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-accent"
                    />
                  ) : null}
                </span>
                <span className="t-micro tracking-normal normal-case">{destination.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ==========================================================================
   Persistent safety label
   ========================================================================== */

export function PrototypeLabel({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { state } = usePrototype();
  const simulated = state.tests.some((test) => test.source === "simulated");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cx(
          "inline-flex items-center gap-1.5 rounded-xs border border-hairline bg-surface-3 px-2 py-1",
          "t-micro text-ink-2 transition-colors duration-(--ps-duration-fast) hover:text-ink-1",
        )}
      >
        <Icon name="shield" size={13} />
        {compact ? "Prototype" : simulated ? "Prototype · Simulated" : "Research prototype"}
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Safety"
        title="What PreSeed is, and is not"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" full onClick={() => setOpen(false)}>
              Close
            </Button>
            <Link
              href="/account/safety"
              onClick={() => setOpen(false)}
              className="flex min-h-(--ps-touch-min) flex-1 items-center justify-center gap-2 rounded-sm bg-accent px-4 t-body-sm font-medium text-accent-ink"
            >
              Safety centre
            </Link>
          </div>
        }
      >
        <p className="t-prose text-ink-1">{PROTOTYPE_DISCLAIMER}</p>
        <ul className="mt-4 space-y-2.5">
          {[
            "Not a diagnosis, and not a medical device.",
            "Not a replacement for laboratory or clinical testing.",
            "No claim about conception or pregnancy is made anywhere in this product.",
            "PreSeed cannot confirm azoospermia. A zero or extremely low result requires laboratory confirmation.",
            "No endocrine diagnosis, and no hormone-treatment recommendation.",
            "Never a recommendation to start or stop a prescribed medicine.",
          ].map((line) => (
            <li key={line} className="flex gap-2.5 t-body-sm text-ink-2">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />
              {line}
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

/* ==========================================================================
   Screen chrome
   ========================================================================== */

export function ScreenHeader({
  title,
  eyebrow,
  back,
  action,
}: {
  title: string;
  eyebrow?: string;
  back?: string | true;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-ground/92 backdrop-blur-md pad-safe-top">
      <div className="mx-auto flex min-h-(--ps-header-height) max-w-(--ps-shell-max) items-center gap-2 px-2">
        {back ? (
          typeof back === "string" ? (
            <Link
              href={back}
              className="flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-3"
            >
              <Icon name="chevron-left" size={22} label="Back" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-3"
            >
              <Icon name="chevron-left" size={22} label="Back" />
            </button>
          )
        ) : (
          <span className="w-2" />
        )}
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="t-micro text-ink-3">{eyebrow}</p> : null}
          <h1 className="truncate t-title-2 text-ink-1">{title}</h1>
        </div>
        {action ?? <PrototypeLabel compact />}
      </div>
    </header>
  );
}

/** The tabbed application shell. */
export function AppShell({
  children,
  header,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh bg-ground">
      <a
        href="#screen"
        className="visually-hidden fixed left-3 top-3 z-50 rounded-sm bg-accent px-3 py-2 t-body-sm font-medium text-accent-ink"
      >
        Skip to content
      </a>
      <Announcer />
      {header}
      <main
        id="screen"
        tabIndex={-1}
        key={pathname}
        className={cx(
          "mx-auto max-w-(--ps-shell-max) px-4 pb-32 pt-4",
          "[animation:ps-rise-in_var(--ps-duration-slow)_var(--ps-ease-out)]",
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

/** A tabbed screen: chrome, header and content in one wrapper. */
export function Screen({
  title,
  eyebrow,
  back,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  back?: string | true;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AppShell header={<ScreenHeader title={title} eyebrow={eyebrow} back={back} action={action} />}>
      {children}
    </AppShell>
  );
}

/**
 * The linear-flow shell for signup, consent and onboarding: a progress rail, a
 * scrolling body and a sticky commit bar. No bottom navigation, because the
 * user has one job.
 */
export function FlowShell({
  step,
  total,
  stepLabel,
  title,
  intro,
  back,
  footer,
  children,
}: {
  step: number;
  total: number;
  stepLabel: string;
  title: string;
  intro?: React.ReactNode;
  back?: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-dvh flex-col bg-ground">
      <a
        href="#screen"
        className="visually-hidden fixed left-3 top-3 z-50 rounded-sm bg-accent px-3 py-2 t-body-sm font-medium text-accent-ink"
      >
        Skip to content
      </a>
      <Announcer />
      <header className="sticky top-0 z-20 border-b border-hairline bg-ground/92 backdrop-blur-md pad-safe-top">
        <div className="mx-auto max-w-(--ps-shell-max) px-2">
          <div className="flex min-h-(--ps-header-height) items-center gap-2">
            {back ? (
              <Link
                href={back}
                className="flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-3"
              >
                <Icon name="chevron-left" size={22} label="Back" />
              </Link>
            ) : (
              <span className="w-2" />
            )}
            <p className="flex-1 t-micro text-ink-3">{stepLabel}</p>
            <PrototypeLabel compact />
          </div>
          {/* Numeric progress accompanies the bar, so the rail is not the only cue. */}
          <div className="flex items-center gap-3 pb-3 pl-2 pr-2">
            <div
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={total}
              aria-label={`Step ${step} of ${total}`}
              className="flex h-1 flex-1 gap-1 overflow-hidden rounded-full"
            >
              {Array.from({ length: total }).map((_, index) => (
                <span
                  key={index}
                  className={cx("h-full flex-1 rounded-full", index < step ? "bg-accent" : "bg-surface-3")}
                />
              ))}
            </div>
            <span className="t-mono text-ink-3">
              {step}/{total}
            </span>
          </div>
        </div>
      </header>

      <main
        id="screen"
        tabIndex={-1}
        key={pathname}
        className={cx(
          "mx-auto w-full max-w-(--ps-shell-max) flex-1 px-4 pb-40 pt-5",
          "[animation:ps-rise-in_var(--ps-duration-slow)_var(--ps-ease-out)]",
        )}
      >
        <h1 className="t-title-hero text-ink-1">{title}</h1>
        {intro ? <div className="mt-2.5 t-body text-ink-2">{intro}</div> : null}
        <div className="mt-7">{children}</div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface-1/95 backdrop-blur-md pad-safe-bottom">
        <div className="mx-auto max-w-(--ps-shell-max) px-4 py-3">{footer}</div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Safety and escalation
   ========================================================================== */

/**
 * A clinical alert. Cannot be dismissed and never sits below a score, because a
 * serious flag must not be averaged away by a good composite.
 */
export function SafetyAlert({
  severity,
  title,
  body,
  action,
  nonModifiable,
}: {
  severity: "escalation" | "attention";
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
  nonModifiable?: boolean;
}) {
  const tone = severity === "escalation" ? "escalation" : "attention";
  return (
    <Card
      tone={tone}
      role="group"
      aria-label={title}
      className={cx("border-l-2", severity === "escalation" ? "border-l-escalation" : "border-l-attention")}
    >
      <div className="flex gap-3">
        <Icon
          name={severity === "escalation" ? "escalation" : "attention"}
          size={20}
          className={cx("mt-0.5 shrink-0", severity === "escalation" ? "text-escalation" : "text-attention")}
        />
        <div className="min-w-0 flex-1">
          <h3 className="t-title-3 text-ink-1">{title}</h3>
          <div className="mt-1.5 t-body-sm text-ink-2">{body}</div>
          {nonModifiable ? (
            <p className="mt-2.5">
              <StatusChip tone="information" glyph="info">
                Does not affect your readiness score
              </StatusChip>
            </p>
          ) : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </Card>
  );
}

/** The persistent, non-legalistic disclaimer strip used at the foot of screens. */
export function DisclaimerFooter() {
  return (
    <p className="mt-8 border-t border-hairline pt-4 t-caption text-ink-3">
      {PROTOTYPE_DISCLAIMER}{" "}
      <Link href="/account/safety" className="text-accent underline underline-offset-2">
        Safety centre
      </Link>
    </p>
  );
}
