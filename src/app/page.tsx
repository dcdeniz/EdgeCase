"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { ReferenceStrip } from "@/components/charts";
import { PrototypeLabel, PROTOTYPE_DISCLAIMER } from "@/components/shell";
import { ButtonLink, Card, MetaBadge, SimulatedBadge, StatusChip } from "@/components/ui";
import { demoBaseline } from "@/lib/fixtures";
import { markerCatalogue } from "@/lib/clinical";

const motility = demoBaseline.markers.find((marker) => marker.code === "progressive_motility_pct")!;
const definition = markerCatalogue.progressive_motility_pct;

/**
 * The hero is the product's argument performed rather than described: a real
 * measurement, the mechanism behind it, the action that follows, and the study
 * underneath. Everything else on this page is deliberately quiet.
 */
export default function WelcomePage() {
  return (
    <div className="min-h-dvh bg-ground">
      <header className="mx-auto flex max-w-(--ps-shell-max) items-center justify-between px-4 py-4 pad-safe-top">
        <span className="t-title-3 tracking-tight text-ink-1">PreSeed</span>
        <PrototypeLabel />
      </header>

      <main id="screen" className="mx-auto max-w-(--ps-shell-max) px-4 pb-28">
        <p className="t-micro text-accent">Male fertility intelligence</p>
        <h1 className="mt-2 t-prose-lead text-ink-1">
          Most fertility apps hand you advice. PreSeed hands you the reasoning behind it.
        </h1>

        {/* The signature, in miniature. */}
        <section aria-labelledby="specimen" className="mt-7">
          <h2 id="specimen" className="visually-hidden">
            An example of how PreSeed explains a recommendation
          </h2>

          <ol className="m-0 list-none p-0">
            <li className="relative pl-9">
              <span aria-hidden="true" className="absolute bottom-0 left-[11px] top-7 w-px bg-hairline" />
              <span
                aria-hidden="true"
                className="absolute left-0 top-0.5 flex size-[23px] items-center justify-center rounded-full border border-line-control bg-surface-1 t-mono text-ink-2"
              >
                1
              </span>
              <p className="t-micro text-ink-3">Your result</p>
              <div className="mt-2 rounded-md border border-hairline bg-surface-1 p-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="t-body-sm text-ink-2">{definition.label}</span>
                  <span className="flex items-baseline gap-1">
                    <span className="t-title-1 text-ink-1">{motility.value}</span>
                    <span className="t-caption text-ink-3">{definition.unit}</span>
                  </span>
                </div>
                <div className="mt-2.5">
                  <ReferenceStrip marker={motility} />
                </div>
                <div className="mt-2.5">
                  <SimulatedBadge compact />
                </div>
              </div>
              <div className="pb-6" />
            </li>

            <li className="relative pl-9">
              <span aria-hidden="true" className="absolute bottom-0 left-[11px] top-7 w-px bg-hairline" />
              <span
                aria-hidden="true"
                className="absolute left-0 top-0.5 flex size-[23px] items-center justify-center rounded-full border border-line-control bg-surface-1 t-mono text-ink-2"
              >
                2
              </span>
              <p className="t-micro text-ink-3">Mechanism</p>
              <p className="mt-2 t-prose text-ink-1">
                Forward movement is powered by mitochondria in the sperm midpiece, and those mitochondria
                are unusually exposed to oxidative damage — sperm carry very little of the repair
                machinery other cells rely on.
              </p>
              <div className="pb-6" />
            </li>

            <li className="relative pl-9">
              <span aria-hidden="true" className="absolute bottom-0 left-[11px] top-7 w-px bg-hairline" />
              <span
                aria-hidden="true"
                className="absolute left-0 top-0.5 flex size-[23px] items-center justify-center rounded-full border border-line-control bg-surface-1 t-mono text-ink-2"
              >
                3
              </span>
              <p className="t-micro text-ink-3">Bounded action</p>
              <div className="mt-2 rounded-md border border-accent-line bg-accent-quiet p-3.5">
                <p className="t-title-3 text-ink-1">
                  Four fish meals a week, nuts daily, olive oil for cooking
                </p>
                <p className="mt-1.5 t-body-sm text-ink-2">
                  Three substitutions, reviewed at your next check-in. No supplement is recommended here.
                </p>
              </div>
              <div className="pb-6" />
            </li>

            <li className="relative pl-9">
              <span
                aria-hidden="true"
                className="absolute left-0 top-0.5 flex size-[23px] items-center justify-center rounded-full border border-line-control bg-surface-1 t-mono text-ink-2"
              >
                4
              </span>
              <p className="t-micro text-ink-3">Evidence and limits</p>
              <div className="mt-2 rounded-md border border-hairline bg-surface-1 p-3.5">
                <p className="t-body-sm text-ink-1">Mediterranean-diet systematic review and meta-analysis</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <MetaBadge glyph="info">Moderate confidence</MetaBadge>
                  <MetaBadge glyph="results">Observational</MetaBadge>
                </div>
                <p className="mt-2.5 t-caption text-ink-2">
                  Observational evidence supports moving in this direction. It cannot promise a specific
                  change in your motility, and nothing here predicts conception.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section aria-labelledby="outputs" className="mt-10">
          <h2 id="outputs" className="t-title-2 text-ink-1">
            Four separate answers, never one score
          </h2>
          <p className="mt-2 t-body-sm text-ink-2">
            Collapsing measurement, behaviour, prediction and data quality into a single number is how
            these products mislead people. PreSeed keeps them apart.
          </p>
          <ul className="mt-4 space-y-2">
            {[
              {
                title: "Clinical profile",
                body: "What a laboratory measured, with its unit, provenance, verification and reference context.",
              },
              {
                title: "Readiness score",
                body: "A transparent 0–100 read on modifiable behaviours. It never claims your sperm quality changed.",
              },
              {
                title: "Named screening risks",
                body: "Specific endpoints with uncertainty and a model version — or an honest empty state when nothing is connected.",
              },
              {
                title: "Data confidence",
                body: "How much trustworthy information sits underneath. Missing data lands here, not on your score.",
              },
            ].map((output) => (
              <li key={output.title} className="rounded-md border border-hairline bg-surface-1 p-3.5">
                <p className="t-title-3 text-ink-1">{output.title}</p>
                <p className="mt-1 t-body-sm text-ink-2">{output.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* The limits belong on the first screen, not in a terms page. */}
        <section aria-labelledby="limits" className="mt-10">
          <h2 id="limits" className="t-title-2 text-ink-1">
            What PreSeed will not do
          </h2>
          <ul className="mt-3 space-y-2.5">
            {[
              "Confirm azoospermia. That needs a centrifuged sample examined in a laboratory.",
              "Diagnose anything, or replace a clinical assessment.",
              "Predict conception or pregnancy.",
              "Recommend hormone treatment, or suggest you stop a prescribed medicine.",
              "Sell you a supplement on the strength of a figure it has not checked.",
            ].map((line) => (
              <li key={line} className="flex gap-2.5 t-body-sm text-ink-2">
                <Icon name="unavailable" size={17} className="mt-0.5 shrink-0 text-ink-3" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <Card>
            <p className="t-micro text-ink-3">Tracks</p>
            <p className="mt-1.5 t-body-sm text-ink-2">
              PreSeed also speaks to two groups nobody else designs for: men rebuilding fertility after a
              vasectomy reversal, and men who need to preserve fertility before cancer treatment starts.
              Each changes what the app prioritises.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StatusChip tone="neutral" glyph="target">
                Track selection is step one
              </StatusChip>
            </div>
          </Card>
        </section>

        <p className="mt-8 t-caption text-ink-3">{PROTOTYPE_DISCLAIMER}</p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface-1/95 backdrop-blur-md pad-safe-bottom">
        <div className="mx-auto flex max-w-(--ps-shell-max) gap-2 px-4 py-3">
          <Link
            href="/prototype"
            className="flex min-h-(--ps-touch-min) flex-1 items-center justify-center rounded-sm border border-line-control px-4 t-body-sm font-medium text-ink-1 hover:bg-surface-3"
          >
            Screen map
          </Link>
          <ButtonLink href="/start/account" full glyphAfter="chevron-right">
            Get started
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
