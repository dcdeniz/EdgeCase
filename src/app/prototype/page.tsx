"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { Button, Card, SectionHeader, StatusChip, cx } from "@/components/ui";
import { PROTOTYPE_DISCLAIMER } from "@/components/shell";
import { usePrototype } from "@/lib/store";

type Entry = { href: string; label: string; note: string; state?: string };

const criticalPath: Entry[] = [
  { href: "/start/account", label: "1 · Sign up", note: "Account, then privacy, consent and the disclaimer" },
  { href: "/start/track", label: "2 · Track selection", note: "Changes urgency, navigation and whether a protocol applies at all" },
  { href: "/onboarding/goal", label: "3 · Onboarding", note: "Goal and timeline, lifestyle, clinical history, exposure, review" },
  { href: "/tests/new", label: "4 · Clinical test entry", note: "Manual, upload or clearly labelled demo, then collection conditions" },
  { href: "/results/profile", label: "5 · Clinical profile", note: "Measured values with reference context and provenance" },
  { href: "/results", label: "6 · Four outputs", note: "Profile, readiness, screening risks and data confidence, kept apart" },
  { href: "/results/reasoning/chain-progressive-motility", label: "7 · Parameter reasoning", note: "The signature: result → mechanism → action → evidence" },
  { href: "/protocol", label: "8 · Dated protocol", note: "Day and week, current actions, timeline, versioning" },
  { href: "/protocol/check-in", label: "9 · Adherence check-in", note: "Quick logging and the two check-in questions" },
  { href: "/trends", label: "10 · Retest and trends", note: "Baseline to latest, with comparability and variability" },
  { href: "/coach?context=progressive_motility_pct&label=Progressive%20motility%20result", label: "11 · Contextual explanation", note: "Ask PreSeed, launched from a result, with citations and limits" },
];

const sections: Array<{ title: string; eyebrow: string; entries: Entry[] }> = [
  {
    eyebrow: "Entry",
    title: "Signup and consent",
    entries: [
      { href: "/", label: "Welcome", note: "The reasoning chain, performed" },
      { href: "/start/account", label: "Create account or sign in", note: "" },
      { href: "/start/privacy", label: "Privacy summary", note: "" },
      { href: "/start/consent", label: "Health-data consent", note: "" },
      { href: "/start/disclaimer", label: "Disclaimer", note: "" },
      { href: "/start/track", label: "Track selection", note: "" },
    ],
  },
  {
    eyebrow: "Onboarding",
    title: "Questionnaire",
    entries: [
      { href: "/onboarding/goal", label: "Goal and timeline", note: "Protocol length and retest date update live" },
      { href: "/onboarding/lifestyle", label: "Lifestyle", note: "Sleep, nicotine, alcohol, diet, activity, heat" },
      { href: "/onboarding/health", label: "Clinical history", note: "Conditions, medicines, sexual health, clinical gates" },
      { href: "/onboarding/exposure", label: "Environmental exposure", note: "" },
      { href: "/onboarding/review", label: "Review", note: "First readiness score, behaviour only" },
    ],
  },
  {
    eyebrow: "Clinical",
    title: "Test entry and results",
    entries: [
      { href: "/tests/new", label: "Add a result", note: "Three modes, one surface" },
      { href: "/results", label: "Results hub", note: "" },
      { href: "/results/profile", label: "Clinical profile", note: "" },
      { href: "/results/profile/progressive_motility_pct", label: "Marker detail", note: "Reference strip, trend, provenance" },
      { href: "/results/readiness", label: "Readiness detail", note: "Domain breakdown and drivers" },
      { href: "/results/risks", label: "Screening risks", note: "All four states specified" },
      { href: "/results/confidence", label: "Data confidence", note: "" },
      { href: "/trends", label: "Trends", note: "" },
    ],
  },
  {
    eyebrow: "Reasoning",
    title: "Parameter reasoning chains",
    entries: [
      { href: "/results/reasoning/chain-concentration", label: "Concentration", note: "" },
      { href: "/results/reasoning/chain-progressive-motility", label: "Progressive motility", note: "" },
      { href: "/results/reasoning/chain-morphology", label: "Morphology", note: "Includes clinical escalation" },
    ],
  },
  {
    eyebrow: "Protocol",
    title: "Plan and adherence",
    entries: [
      { href: "/today", label: "Today", note: "One question: what do I do now" },
      { href: "/protocol", label: "Protocol", note: "" },
      { href: "/protocol/check-in", label: "Check-in", note: "" },
    ],
  },
  {
    eyebrow: "Tracks",
    title: "Track-specific experiences",
    entries: [
      { href: "/reversal", label: "Vasectomy-reversal tracking", note: "Longitudinal, no protocol gate" },
      { href: "/preservation", label: "Pre-treatment preservation", note: "Urgency and navigation only" },
    ],
  },
  {
    eyebrow: "Evidence",
    title: "Library and explanation",
    entries: [
      { href: "/evidence", label: "Evidence library", note: "Three review statuses" },
      { href: "/evidence/antioxidant-effect-candidate", label: "A research candidate", note: "Deliberately cannot look approved" },
      { href: "/coach?context=readiness-heat&label=Heat%20exposure%20domain", label: "Evidence-insufficient answer", note: "" },
      { href: "/coach?context=risk-below-reference-motility&label=Screening%20risk", label: "Explanation unavailable", note: "" },
    ],
  },
  {
    eyebrow: "Account",
    title: "Settings and safety",
    entries: [
      { href: "/account", label: "Account", note: "Includes sample-data controls" },
      { href: "/account/display", label: "Display and accessibility", note: "Theme, text size, motion, contrast" },
      { href: "/account/data", label: "Your data", note: "Provenance, consent, deletion" },
      { href: "/account/safety", label: "Safety centre", note: "" },
    ],
  },
  {
    eyebrow: "Handoff",
    title: "Design system",
    entries: [{ href: "/design", label: "Tokens, components and states", note: "Implementation reference" }],
  },
];

export default function PrototypeMapPage() {
  const { state, seedDemo, reset } = usePrototype();
  const seeded = state.tests.length > 0;

  return (
    <div className="min-h-dvh bg-ground">
      <header className="mx-auto flex max-w-(--ps-shell-max) items-center justify-between px-4 py-4 pad-safe-top">
        <Link href="/" className="t-title-3 tracking-tight text-ink-1">
          PreSeed
        </Link>
      </header>

      <main id="screen" className="mx-auto max-w-(--ps-shell-max) px-4 pb-20">
        <h1 className="t-title-1 text-ink-1">Screen map</h1>
        <p className="mt-2 t-body-sm text-ink-2">
          Every screen in the prototype, connected. Load the demo state first if you want the clinical
          screens populated.
        </p>

        <Card className="mt-5">
          <p className="t-micro text-ink-3">Workspace state</p>
          <p className="mt-1.5 t-body-sm text-ink-2">
            The demo places you on day 97 of a 100-day protocol with a simulated baseline, a realistic
            adherence history and a closing analysis ready to enter.
          </p>
          <div className="mt-3 grid gap-2">
            <Button
              glyph="simulated"
              onClick={() => {
                seedDemo("baseline");
                seedDemo("hormones");
              }}
            >
              {seeded ? "Reload demo state" : "Load demo state"}
            </Button>
            {seeded ? (
              <Button variant="secondary" onClick={reset}>
                Clear everything
              </Button>
            ) : null}
          </div>
          {seeded ? (
            <p className="mt-3">
              <StatusChip tone="supported">Loaded</StatusChip>
            </p>
          ) : null}
        </Card>

        <section className="mt-8" aria-labelledby="critical">
          <SectionHeader id="critical" eyebrow="Hackathon path" title="The critical route, in order" />
          <ol className="m-0 list-none space-y-2 p-0">
            {criticalPath.map((entry, index) => (
              <li key={entry.href} className="relative pl-8">
                {index < criticalPath.length - 1 ? (
                  <span aria-hidden="true" className="absolute bottom-0 left-[11px] top-8 w-px bg-hairline" />
                ) : null}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-3 flex size-[23px] items-center justify-center rounded-full border border-accent-line bg-accent-quiet t-mono text-accent"
                >
                  {index + 1}
                </span>
                <Link
                  href={entry.href}
                  className="flex min-h-(--ps-touch-min) items-center gap-3 rounded-sm border border-hairline bg-surface-1 px-3 py-2.5 hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block t-body-sm font-medium text-ink-1">
                      {entry.label.replace(/^\d+ · /, "")}
                    </span>
                    {entry.note ? (
                      <span className="mt-0.5 block t-caption text-ink-3">{entry.note}</span>
                    ) : null}
                  </span>
                  <Icon name="chevron-right" size={17} className="shrink-0 text-ink-3" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {sections.map((section) => (
          <section key={section.title} className="mt-8" aria-labelledby={section.title}>
            <SectionHeader id={section.title} eyebrow={section.eyebrow} title={section.title} />
            <Card inset>
              {section.entries.map((entry, index) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={cx(
                    "flex min-h-(--ps-touch-min) items-center gap-3 rounded-sm px-2 py-2.5 hover:bg-surface-3",
                    index > 0 && "border-t border-hairline",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block t-body-sm text-ink-1">{entry.label}</span>
                    {entry.note ? (
                      <span className="mt-0.5 block t-caption text-ink-3">{entry.note}</span>
                    ) : null}
                  </span>
                  <Icon name="chevron-right" size={17} className="shrink-0 text-ink-3" />
                </Link>
              ))}
            </Card>
          </section>
        ))}

        <p className="mt-8 border-t border-hairline pt-4 t-caption text-ink-3">{PROTOTYPE_DISCLAIMER}</p>
      </main>
    </div>
  );
}
