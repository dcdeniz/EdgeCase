"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { AdherenceBand, DomainBars, ReferenceStrip, ScoreMeter, TrendChart } from "@/components/charts";
import { PrototypeLabel } from "@/components/shell";
import {
  Button,
  Card,
  ChoiceGroup,
  ConfirmSheet,
  Disclosure,
  EmptyState,
  ErrorState,
  Field,
  InlineStatus,
  LoadingBlock,
  MetaBadge,
  MetaList,
  OfflineNotice,
  PendingAction,
  PendingIntegration,
  RatingControl,
  Segmented,
  Sheet,
  SectionHeader,
  Select,
  SimulatedBadge,
  Skeleton,
  StatusChip,
  TextInput,
  UnitInput,
  announce,
  type Tone,
} from "@/components/ui";
import { demoBaseline, demoRetest } from "@/lib/fixtures";

const colourRoles: Array<{ group: string; roles: Array<{ name: string; token: string; note: string }> }> = [
  {
    group: "Surfaces",
    roles: [
      { name: "ground", token: "--ps-ground", note: "The page plane" },
      { name: "surface-1", token: "--ps-surface-1", note: "Cards" },
      { name: "surface-2", token: "--ps-surface-2", note: "Sheets and raised panels" },
      { name: "surface-3", token: "--ps-surface-3", note: "Inset areas, control tracks" },
    ],
  },
  {
    group: "Ink",
    roles: [
      { name: "ink-1", token: "--ps-ink-1", note: "Primary text and measured values" },
      { name: "ink-2", token: "--ps-ink-2", note: "Secondary text" },
      { name: "ink-3", token: "--ps-ink-3", note: "Muted labels — still 4.5:1 everywhere" },
    ],
  },
  {
    group: "Lines",
    roles: [
      { name: "hairline", token: "--ps-line-hairline", note: "Decorative separation" },
      { name: "line-strong", token: "--ps-line-strong", note: "Emphasised separation" },
      { name: "line-control", token: "--ps-line-control", note: "Control borders — 3:1 minimum" },
    ],
  },
  {
    group: "Status",
    roles: [
      { name: "accent", token: "--ps-accent", note: "Interactive, and measured-and-supported" },
      { name: "supported", token: "--ps-supported", note: "Within reference, evidence-backed" },
      { name: "attention", token: "--ps-attention", note: "Needs attention, comparability caution" },
      { name: "escalation", token: "--ps-escalation", note: "Clinical escalation, hard limits" },
      { name: "information", token: "--ps-information", note: "Neutral context, reference bands" },
      { name: "unavailable", token: "--ps-unavailable", note: "Pending, insufficient, not measured" },
    ],
  },
  {
    group: "Chart series",
    roles: [
      { name: "series-1", token: "--ps-series-1", note: "First categorical slot" },
      { name: "series-2", token: "--ps-series-2", note: "Second" },
      { name: "series-3", token: "--ps-series-3", note: "Third — the cap for all-pairs forms" },
    ],
  },
];

const typeRoles = [
  { cls: "t-display-1", label: "display-1", spec: "2.75rem / 1.02 / −0.03em / 400 / tabular" },
  { cls: "t-display-2", label: "display-2", spec: "2rem / 1.1 / −0.025em / 400 / tabular" },
  { cls: "t-title-1", label: "title-1", spec: "1.375rem / 1.24 / −0.017em / 600" },
  { cls: "t-title-2", label: "title-2", spec: "1.125rem / 1.3 / −0.012em / 600" },
  { cls: "t-title-3", label: "title-3", spec: "1rem / 1.35 / −0.008em / 600" },
  { cls: "t-body", label: "body", spec: "1rem / 1.55 / 400" },
  { cls: "t-body-sm", label: "body-sm", spec: "0.875rem / 1.5 / 400" },
  { cls: "t-caption", label: "caption", spec: "0.8125rem / 1.45 / 400" },
  { cls: "t-micro", label: "micro", spec: "0.6875rem / 1.3 / +0.085em / 600 / uppercase" },
  { cls: "t-prose", label: "prose", spec: "Serif · 1.0625rem / 1.62 / max 68ch" },
  { cls: "t-prose-lead", label: "prose-lead", spec: "Serif · 1.25rem / 1.42 / max 40ch" },
  { cls: "t-mono", label: "mono", spec: "Mono · 0.75rem / 1.4 / +0.01em / tabular" },
];

const tones: Tone[] = ["neutral", "accent", "supported", "attention", "escalation", "information", "unavailable"];

const glyphs: IconName[] = [
  "today", "results", "protocol", "evidence", "account", "check", "check-circle",
  "partial-circle", "skip-circle", "attention", "escalation", "info", "unavailable",
  "pending", "simulated", "lab", "hand", "upload", "coach", "target", "shield", "lock",
  "calendar", "pencil", "phone", "book", "arrow-up", "arrow-down", "arrow-flat", "external",
];

export default function DesignSystemPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [seg, setSeg] = useState<"a" | "b">("a");
  const [rating, setRating] = useState<number>();
  const [choice, setChoice] = useState<"one" | "two">();

  const motility = demoBaseline.markers.find((m) => m.code === "progressive_motility_pct")!;
  const motilityLater = demoRetest.markers.find((m) => m.code === "progressive_motility_pct")!;

  return (
    <div className="min-h-dvh bg-ground">
      <header className="sticky top-0 z-20 border-b border-hairline bg-ground/92 backdrop-blur-md pad-safe-top">
        <div className="mx-auto flex min-h-(--ps-header-height) max-w-(--ps-shell-max) items-center justify-between px-4">
          <div>
            <p className="t-micro text-ink-3">Handoff</p>
            <h1 className="t-title-2 text-ink-1">Design system</h1>
          </div>
          <PrototypeLabel compact />
        </div>
      </header>

      <main id="screen" className="mx-auto max-w-(--ps-shell-max) px-4 pb-20 pt-5">
        <p className="t-body-sm text-ink-2">
          Live reference for the implemented system. Every value here is a token read at runtime, so this
          page reflects the current theme, text size and contrast settings.{" "}
          <Link href="/account/display" className="text-accent underline underline-offset-2">
            Change them
          </Link>{" "}
          and this page changes with them.
        </p>

        {/* ---------------------------------------------------------------- */}
        <section className="mt-8" aria-labelledby="colour">
          <SectionHeader id="colour" eyebrow="Tokens" title="Colour roles" />
          <p className="mb-3 t-body-sm text-ink-2">
            Semantic names only. No component references a raw hex value. Every ink and status role clears
            4.5:1 against every surface in both themes; control borders clear 3:1.
          </p>
          <div className="space-y-4">
            {colourRoles.map((group) => (
              <Card key={group.group}>
                <p className="t-micro text-ink-3">{group.group}</p>
                <ul className="mt-2.5 space-y-2">
                  {group.roles.map((role) => (
                    <li key={role.name} className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="size-9 shrink-0 rounded-xs border border-hairline"
                        style={{ background: `var(${role.token})` }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block t-mono text-ink-1">{role.name}</span>
                        <span className="block t-caption text-ink-3">{role.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="mt-8" aria-labelledby="type">
          <SectionHeader id="type" eyebrow="Tokens" title="Typography" />
          <Card>
            <p className="t-body-sm text-ink-2">
              Three registers, each with a declared job: <span className="font-medium text-ink-1">sans measures</span>,{" "}
              <span className="font-medium text-ink-1">serif reasons</span>,{" "}
              <span className="font-medium text-ink-1">mono reports machine metadata</span>. The register tells
              you what kind of claim you are reading before you read it.
            </p>
          </Card>
          <div className="mt-3 space-y-3">
            {typeRoles.map((role) => (
              <Card key={role.cls}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="t-mono text-ink-3">{role.label}</span>
                  <span className="t-mono text-ink-3">{role.spec}</span>
                </div>
                <p className={`mt-2 ${role.cls} text-ink-1`}>
                  {role.cls.includes("prose")
                    ? "Progressive motility depends on mitochondria in the sperm midpiece."
                    : role.cls === "t-mono"
                      ? "progressive_motility_pct · who-6e · lab_report"
                      : role.cls.includes("display")
                        ? "27"
                        : "Below reference context"}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="mt-8" aria-labelledby="scale">
          <SectionHeader id="scale" eyebrow="Tokens" title="Spacing, radius, elevation, motion" />
          <Card>
            <p className="t-micro text-ink-3">Spacing · 4px base</p>
            <ul className="mt-2 space-y-1.5">
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((step) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="w-10 t-mono text-ink-3">{step * 4}</span>
                  <span aria-hidden="true" className="h-2 rounded-full bg-accent" style={{ width: step * 4 }} />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="mt-3">
            <p className="t-micro text-ink-3">Radius</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {(["xs", "sm", "md", "lg", "xl"] as const).map((key) => (
                <div key={key} className="text-center">
                  <span
                    aria-hidden="true"
                    className="block size-14 border border-line-control bg-surface-3"
                    style={{ borderRadius: `var(--ps-radius-${key})` }}
                  />
                  <span className="mt-1 block t-mono text-ink-3">{key}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="mt-3">
            <p className="t-micro text-ink-3">Elevation</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {(["e1", "e2", "e3"] as const).map((key) => (
                <div key={key} className="text-center">
                  <span
                    aria-hidden="true"
                    className="block size-14 rounded-sm border border-hairline bg-surface-1"
                    style={{ boxShadow: `var(--ps-elevation-${key.slice(1)})` }}
                  />
                  <span className="mt-1 block t-mono text-ink-3">{key}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 t-caption text-ink-3">
              Dark mode leans on the surface step plus a hairline rather than shadow, which does not read
              on a dark ground.
            </p>
          </Card>

          <Card className="mt-3">
            <p className="t-micro text-ink-3">Motion</p>
            <MetaList
              items={[
                { label: "instant", value: "80ms", hint: "Press feedback" },
                { label: "fast", value: "130ms", hint: "Colour and state" },
                { label: "base", value: "190ms", hint: "Disclosure, rotation" },
                { label: "slow", value: "280ms", hint: "Screen entry, staggered reveal" },
                { label: "sheet", value: "320ms", hint: "Bottom sheet travel" },
                { label: "ease-out", value: "cubic-bezier(.22,1,.36,1)" },
              ]}
            />
            <p className="mt-2 t-caption text-ink-3">
              Reduced motion collapses every duration to 1ms and removes travel, keeping state changes
              legible.
            </p>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="mt-8" aria-labelledby="status">
          <SectionHeader id="status" eyebrow="Vocabulary" title="Status and provenance" />
          <Card>
            <p className="t-body-sm text-ink-2">
              Every state is a (tone, glyph, word) triple. Colour is the third channel, never the first, so
              meaning survives greyscale, colour blindness and forced-colors mode.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tones.map((tone) => (
                <StatusChip key={tone} tone={tone}>
                  {tone}
                </StatusChip>
              ))}
            </div>
            <p className="mt-4 t-micro text-ink-3">Approved labels</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusChip tone="supported">Within reference context</StatusChip>
              <StatusChip tone="attention">Below reference context</StatusChip>
              <StatusChip tone="attention">Needs attention</StatusChip>
              <StatusChip tone="unavailable">Insufficient data</StatusChip>
              <StatusChip tone="escalation" glyph="escalation">Confirmation required</StatusChip>
              <SimulatedBadge />
            </div>
            <p className="mt-4 t-micro text-ink-3">Provenance badges</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <MetaBadge glyph="lab">From lab report</MetaBadge>
              <MetaBadge glyph="hand">Entered by you</MetaBadge>
              <MetaBadge glyph="upload">Uploaded report</MetaBadge>
              <MetaBadge glyph="simulated">Simulated</MetaBadge>
              <MetaBadge glyph="pending">62h abstinence</MetaBadge>
              <MetaBadge glyph="calendar">18 Apr 2026</MetaBadge>
            </div>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="mt-8" aria-labelledby="charts">
          <SectionHeader id="charts" eyebrow="Data" title="Visualisation" />
          <Card>
            <p className="t-micro text-ink-3">Reference strip</p>
            <p className="mt-1 t-caption text-ink-2">
              Solid ink tick is the measured value; hollow ring is the previous one; the quiet fill is the
              reference region. No red or green anywhere — position and words carry the meaning.
            </p>
            <div className="mt-3">
              <ReferenceStrip marker={motilityLater} priorValue={motility.value} />
            </div>
          </Card>

          <Card className="mt-3">
            <p className="t-micro text-ink-3">Trend chart</p>
            <div className="mt-2">
              <TrendChart code="concentration_million_ml" tests={[demoBaseline, demoRetest]} />
            </div>
          </Card>

          <Card className="mt-3">
            <p className="t-micro text-ink-3">Score meter</p>
            <div className="mt-2 space-y-4">
              <ScoreMeter value={64} label="Example readiness" />
              <ScoreMeter value={38} label="Example confidence" tone="information" bands={3} />
              <ScoreMeter value={null} label="No score" />
            </div>
          </Card>

          <Card className="mt-3">
            <p className="t-micro text-ink-3">Domain bars</p>
            <div className="mt-3">
              <DomainBars
                rows={[
                  { id: "a", label: "Sleep and circadian health", score: 70, weight: 20, confidence: "Moderate confidence" },
                  { id: "b", label: "Alcohol, smoking and drugs", score: 91, weight: 20, confidence: "Moderate confidence" },
                  { id: "c", label: "Environmental exposure", score: null, weight: 10, confidence: "Emerging" },
                ]}
              />
            </div>
          </Card>

          <Card className="mt-3">
            <p className="t-micro text-ink-3">Adherence band · rolling window, not a streak</p>
            <div className="mt-3">
              <AdherenceBand
                days={[
                  "completed", "completed", "partial", "completed", "skipped", "completed", "completed",
                  "completed", "none", "partial", "completed", "completed", "skipped", "completed",
                ].map((status, index) => ({
                  date: `2026-07-${String(12 + index).padStart(2, "0")}`,
                  status: status as "completed" | "partial" | "skipped" | "none",
                }))}
              />
            </div>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="mt-8" aria-labelledby="controls">
          <SectionHeader id="controls" eyebrow="Components" title="Controls" />
          <Card>
            <p className="t-micro text-ink-3">Buttons · 44px minimum height</p>
            <div className="mt-2 grid gap-2">
              <Button glyphAfter="chevron-right">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="quiet">Quiet</Button>
              <Button variant="escalation">Escalation</Button>
              <Button disabled>Disabled</Button>
              <PendingAction reason="Depends on an export operation, absent from the current contract." full>
                Export everything
              </PendingAction>
            </div>
          </Card>

          <Card className="mt-3">
            <p className="t-micro text-ink-3">Inputs · hint above, error after commit</p>
            <div className="mt-3">
              <Field label="Sperm concentration" htmlFor="demo-unit" hint="From the concentration row of your report." optional>
                <UnitInput id="demo-unit" hint unit="×10⁶/mL" placeholder="—" />
              </Field>
              <Field label="Email" htmlFor="demo-email" hint="Blur with an invalid value to see the error state." error={undefined}>
                <TextInput id="demo-email" hint type="email" required placeholder="you@example.com" />
              </Field>
              <Field label="Sample complete" htmlFor="demo-select">
                <Select id="demo-select">
                  <option>Yes, the whole sample was collected</option>
                  <option>No, part of it was lost</option>
                </Select>
              </Field>
            </div>
            <Segmented
              label="Segmented control"
              value={seg}
              onChange={setSeg}
              options={[
                { value: "a", label: "Manual", glyph: "pencil" },
                { value: "b", label: "Demo", glyph: "simulated" },
              ]}
            />
            <div className="mt-4">
              <ChoiceGroup
                legend="Choice group"
                hint="Radio semantics, card presentation, 44px rows."
                name="demo-choice"
                value={choice}
                onChange={setChoice}
                options={[
                  { value: "one", label: "First option", note: "With a note explaining why it matters" },
                  { value: "two", label: "Prefer not to say", note: "A real answer, not a gap" },
                ]}
              />
              <RatingControl
                legend="Rating control"
                hint="Numbers visible, so the scale never depends on shape alone."
                name="demo-rating"
                value={rating}
                onChange={setRating}
                lowLabel="Unmanageable"
                highLabel="Easy"
              />
            </div>
          </Card>

          <Card className="mt-3">
            <p className="t-micro text-ink-3">Disclosure · button controlling a region</p>
            <div className="mt-2">
              <Disclosure label="Why this applies to me" glyph="target" defaultOpen>
                <p className="t-prose text-ink-1">
                  Not a details element, because headings inside a summary are dropped from screen-reader
                  heading lists.
                </p>
              </Disclosure>
              <Disclosure label="Known limitations" glyph="attention" count={3}>
                <p className="t-body-sm text-ink-2">Three limitations would list here.</p>
              </Disclosure>
            </div>
          </Card>

          <Card className="mt-3">
            <p className="t-micro text-ink-3">Overlays · native dialog, light-dismiss</p>
            <div className="mt-2 grid gap-2">
              <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                Open sheet
              </Button>
              <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
                Open confirmation
              </Button>
            </div>
          </Card>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="mt-8" aria-labelledby="states">
          <SectionHeader id="states" eyebrow="Components" title="Every state" />
          <div className="space-y-3">
            <div>
              <p className="mb-2 t-micro text-ink-3">Loading</p>
              <LoadingBlock label="Loading your clinical profile" />
            </div>
            <div>
              <p className="mb-2 t-micro text-ink-3">Skeleton</p>
              <Card>
                <Skeleton className="mb-3 h-8 w-32" />
                <Skeleton lines={3} />
              </Card>
            </div>
            <div>
              <p className="mb-2 t-micro text-ink-3">Empty</p>
              <EmptyState
                glyph="protocol"
                title="No protocol yet"
                body="An empty screen is an invitation to act, so it names the one thing that unblocks it."
                action={<Button>Add a clinical result</Button>}
              />
            </div>
            <div>
              <p className="mb-2 t-micro text-ink-3">Error</p>
              <ErrorState
                title="That result could not be saved"
                body="The connection dropped before your entry was stored. Nothing partial was recorded — try again and it will save as one record."
                onRetry={() => announce("Retrying")}
                requestId="9f2c1a70-4c1b-4c1e-b0f9-2b0f3d0a1c44"
              />
            </div>
            <div>
              <p className="mb-2 t-micro text-ink-3">Offline</p>
              <OfflineNotice lastSynced="today at 08:14" />
            </div>
            <div>
              <p className="mb-2 t-micro text-ink-3">Pending integration</p>
              <PendingIntegration
                title="Below-reference concentration"
                body="No model for this endpoint is connected, so PreSeed shows nothing rather than estimating."
                dependency="assessment contract, reserved pending the model-owner pull requests"
              />
            </div>
            <div>
              <p className="mb-2 t-micro text-ink-3">Inline status</p>
              <div className="space-y-2">
                <InlineStatus tone="supported">Result saved to your clinical profile</InlineStatus>
                <InlineStatus tone="attention">Collection conditions differ from your baseline</InlineStatus>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="mt-8" aria-labelledby="icons">
          <SectionHeader id="icons" eyebrow="Assets" title="Icons" />
          <Card>
            <p className="t-caption text-ink-2">
              One 24px grid, 1.5px stroke, round caps, currentColor. Decorative by default, because every
              icon sits beside a word.
            </p>
            <ul className="mt-3 grid grid-cols-5 gap-3">
              {glyphs.map((glyph) => (
                <li key={glyph} className="flex flex-col items-center gap-1 text-center">
                  <Icon name={glyph} size={22} className="text-ink-1" />
                  <span className="t-mono text-[0.6rem] leading-tight text-ink-3">{glyph}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <p className="mt-8 border-t border-hairline pt-4 t-caption text-ink-3">
          Full specifications, measurements and rationale are in{" "}
          <span className="t-mono">docs/design/</span>.
        </p>
      </main>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        eyebrow="Evidence"
        title="What this is based on"
        footer={
          <Button full onClick={() => setSheetOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="t-body-sm text-ink-2">
          Built on the native dialog element with showModal, so inert background content, focus
          containment and Escape handling come from the platform. Light-dismiss is declarative via
          closedby, with a coordinate-checking fallback for Safari.
        </p>
      </Sheet>

      <ConfirmSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => announce("Confirmed")}
        title="Accept these changes?"
        confirmLabel="Accept changes"
        body="Clinically meaningful and irreversible actions confirm before they commit. Accepting creates a new protocol version and keeps the previous one on record."
      />
    </div>
  );
}
