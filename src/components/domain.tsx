"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { ReferenceStrip, ScoreMeter } from "@/components/charts";
import {
  Card,
  Disclosure,
  MetaBadge,
  MetaList,
  PendingIntegration,
  SectionHeader,
  Sheet,
  SimulatedBadge,
  StatusChip,
  cx,
  type Tone,
} from "@/components/ui";
import {
  type ClinicalTest,
  type MarkerValue,
  markerCatalogue,
  plainLabel,
  referenceContextLabel,
  referenceContextOf,
  referenceContextTone,
  sourceLabel,
  verificationLabel,
} from "@/lib/clinical";
import {
  categoryLabel,
  confidenceLabel,
  evidenceById,
  isCitable,
  reviewStatusLabel,
  riskStateLabel,
  type EvidenceClaim,
  type ProtocolCategory,
  type ReasoningChain,
  type RiskOutput,
} from "@/lib/fixtures";
import {
  computeDelta,
  directionWord,
  formatDate,
  formatDelta,
  formatMarker,
  relativeDays,
} from "@/lib/format";
import { type ConfidenceResult, confidenceStateLabel } from "@/lib/store";
import { type ReadinessResult, domains, domainOrder } from "@/lib/readiness";

/* ==========================================================================
   Contextual explanation entry
   ========================================================================== */

/** "Ask PreSeed" is an action on a thing, never a permanent tab. */
export function CoachEntry({
  contextId,
  contextLabel,
  className,
}: {
  contextId: string;
  contextLabel: string;
  className?: string;
}) {
  return (
    <Link
      href={`/coach?context=${encodeURIComponent(contextId)}&label=${encodeURIComponent(contextLabel)}`}
      className={cx(
        "inline-flex min-h-(--ps-touch-min) items-center gap-2 rounded-sm border border-accent-line",
        "bg-accent-quiet px-3 py-2 t-body-sm font-medium text-accent",
        "transition-colors duration-(--ps-duration-fast) hover:brightness-110",
        className,
      )}
    >
      <Icon name="coach" size={17} />
      Ask PreSeed about this
    </Link>
  );
}

/* ==========================================================================
   Clinical marker card
   ========================================================================== */

export function MarkerCard({
  marker,
  test,
  priorMarker,
  priorTest,
  href,
  compact = false,
}: {
  marker: MarkerValue;
  test: ClinicalTest;
  priorMarker?: MarkerValue;
  priorTest?: ClinicalTest;
  href?: string;
  compact?: boolean;
}) {
  const definition = markerCatalogue[marker.code];
  const context = referenceContextOf(marker);
  const delta = priorMarker ? computeDelta(priorMarker.value, marker.value) : null;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Plain name only. The clinical term lives behind the terms dropdown. */}
          <p className="t-title-3 text-ink-1">{plainLabel[marker.code]}</p>
          <p className="mt-1.5 flex items-baseline gap-1.5">
            <span className="t-display-2 text-ink-1">{formatMarker(marker)}</span>
            <span className="t-body-sm text-ink-2">{definition.unit}</span>
          </p>
          <span className="visually-hidden">
            {definition.label}: {formatMarker(marker)} {definition.unitSpoken}.{" "}
            {referenceContextLabel[context]}.
          </span>
        </div>
        {delta ? (
          <span className="flex shrink-0 items-center gap-1 rounded-xs bg-surface-3 px-2 py-1">
            <Icon
              name={delta.direction === "up" ? "arrow-up" : delta.direction === "down" ? "arrow-down" : "arrow-flat"}
              size={14}
              className="text-ink-2"
            />
            <span className="t-mono text-ink-1">{formatDelta(delta, definition.decimals)}</span>
            <span className="t-caption text-ink-3">{directionWord[delta.direction]}</span>
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <ReferenceStrip marker={marker} priorValue={priorMarker?.value} />
      </div>

      {!compact ? (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <MetaBadge glyph={test.source === "simulated" ? "simulated" : test.source === "upload" ? "upload" : "hand"}>
              {sourceLabel[test.source]}
            </MetaBadge>
            <MetaBadge glyph={marker.verification === "lab_report" ? "lab" : "pencil"}>
              {verificationLabel[marker.verification]}
            </MetaBadge>
            <MetaBadge glyph="calendar">{formatDate(test.collectedAt)}</MetaBadge>
          </div>
          {priorTest ? (
            <p className="mt-2 t-caption text-ink-3">
              Compared with {formatDate(priorTest.collectedAt)}
              {priorTest.labName === test.labName ? ", same laboratory" : ", different laboratory"}
              {priorTest.abstinenceHours != null && test.abstinenceHours != null
                ? `, abstinence ${priorTest.abstinenceHours}h then ${test.abstinenceHours}h`
                : ""}
              .
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-md border border-hairline bg-surface-1 p-4 shadow-e1 transition-colors duration-(--ps-duration-fast) hover:bg-surface-2"
      >
        {body}
        <span className="mt-3 flex items-center gap-1 t-caption font-medium text-accent">
          Open marker
          <Icon name="chevron-right" size={14} />
        </span>
      </Link>
    );
  }

  return <Card>{body}</Card>;
}

/** A marker the catalogue expects but no test measured. */
export function MissingMarkerCard({ code }: { code: keyof typeof markerCatalogue }) {
  const definition = markerCatalogue[code];
  return (
    <Card className="border-dashed">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="t-micro text-ink-3">{definition.label}</p>
          <p className="mt-1 t-title-2 text-ink-3">Not measured</p>
        </div>
        <StatusChip tone="unavailable">Lowers confidence</StatusChip>
      </div>
      <p className="mt-2 t-caption text-ink-2">
        {definition.specialistOnly
          ? "Requires a specialist assay. Missing data reduces your data confidence; it never reduces your readiness score."
          : "Missing data reduces your data confidence; it never reduces your readiness score."}
      </p>
    </Card>
  );
}

/* ==========================================================================
   Readiness summary
   ========================================================================== */

export function ReadinessSummary({
  readiness,
  href = "/results/readiness",
}: {
  readiness: ReadinessResult;
  href?: string;
}) {
  return (
    <Card>
      <SectionHeader
        eyebrow="Readiness score"
        title={readiness.band.label}
        action={
          <span className="flex items-baseline gap-1">
            <span className="t-display-1 text-ink-1">{readiness.score ?? "—"}</span>
            <span className="t-caption text-ink-3">/100</span>
          </span>
        }
      />
      <ScoreMeter value={readiness.score} label="Readiness score out of 100" />

      {/* The single most important sentence on this card. */}
      <p className="mt-3 rounded-sm bg-surface-3 px-3 py-2.5 t-body-sm text-ink-2">
        This reflects modifiable behaviours, not measured sperm quality.
      </p>

      <p className="mt-3 t-body-sm text-ink-2">{readiness.band.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <MetaBadge glyph="pending">{readiness.ruleVersion}</MetaBadge>
        {readiness.missingInputs.length > 0 ? (
          <StatusChip tone="unavailable">
            {readiness.missingInputs.length} inputs missing
          </StatusChip>
        ) : null}
      </div>

      <Link
        href={href}
        className="mt-4 flex min-h-(--ps-touch-min) items-center justify-between rounded-sm bg-surface-3 px-3 t-body-sm font-medium text-ink-1"
      >
        See what moved it
        <Icon name="chevron-right" size={18} className="text-ink-3" />
      </Link>
    </Card>
  );
}

export function DomainDetail({ readiness }: { readiness: ReadinessResult }) {
  return (
    <div className="space-y-4">
      {domainOrder.map((id) => {
        const definition = domains[id];
        const result = readiness.domains.find((candidate) => candidate.id === id)!;
        return (
          <Card key={id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="t-title-3 text-ink-1">{definition.label}</h3>
                <p className="mt-0.5 t-caption text-ink-3">{definition.summary}</p>
              </div>
              <span className="shrink-0 t-mono text-ink-1">
                {result.score ?? "—"}
                <span className="text-ink-3">/100</span>
              </span>
            </div>

            <div className="mt-3">
              <ScoreMeter value={result.score} label={`${definition.label} score`} bands={4} />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <MetaBadge glyph="calendar">{definition.window}</MetaBadge>
              <MetaBadge glyph="info">{confidenceLabel[definition.evidenceConfidence]}</MetaBadge>
              <MetaBadge glyph="target">weight {definition.weight}</MetaBadge>
            </div>

            {result.drivers.length > 0 ? (
              <ul className="mt-3 space-y-2 border-t border-hairline pt-3">
                {result.drivers.map((driver) => (
                  <li key={driver.label} className="flex gap-2.5">
                    <span
                      className={cx(
                        "mt-0.5 shrink-0 t-mono",
                        driver.points > 0 ? "text-supported" : driver.points < 0 ? "text-attention" : "text-ink-3",
                      )}
                    >
                      {driver.points > 0 ? "+" : driver.points < 0 ? "−" : "±"}
                      {Math.abs(driver.points)}
                    </span>
                    <span className="min-w-0">
                      <span className="block t-body-sm text-ink-1">{driver.label}</span>
                      {driver.detail ? (
                        <span className="mt-0.5 block t-caption text-ink-3">{driver.detail}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {result.missing.length > 0 ? (
              <p className="mt-3 flex items-start gap-2 rounded-sm bg-surface-3 px-3 py-2.5 t-caption text-ink-2">
                <Icon name="info" size={15} className="mt-0.5 shrink-0 text-ink-3" />
                Missing: {result.missing.join(", ")}. This lowers your data confidence, not your readiness.
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {definition.evidenceIds.length > 0 ? <CitationButton ids={definition.evidenceIds} /> : null}
              <CoachEntry contextId={`readiness-${id}`} contextLabel={`${definition.label} domain`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   Data confidence
   ========================================================================== */

const confidenceTone: Record<string, Tone> = {
  strong: "supported",
  partial: "attention",
  weak: "attention",
  missing: "unavailable",
};

export function ConfidenceCard({
  confidence,
  href = "/results/confidence",
  detailed = false,
}: {
  confidence: ConfidenceResult;
  href?: string;
  detailed?: boolean;
}) {
  return (
    <Card>
      <SectionHeader
        eyebrow="Data confidence"
        title={confidence.bandLabel}
        action={
          <span className="flex items-baseline gap-1">
            <span className="t-display-2 text-ink-1">{confidence.score}</span>
            <span className="t-caption text-ink-3">/100</span>
          </span>
        }
      />
      <ScoreMeter value={confidence.score} label="Data confidence out of 100" tone="information" bands={3} />
      <p className="mt-3 t-body-sm text-ink-2">
        How much trustworthy information sits under everything else on this screen. Missing data lands
        here, never on your readiness score.
      </p>

      {detailed ? (
        <ul className="mt-4 space-y-3 border-t border-hairline pt-4">
          {confidence.factors.map((factor) => (
            <li key={factor.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="t-body-sm font-medium text-ink-1">{factor.label}</span>
                <StatusChip tone={confidenceTone[factor.state]}>
                  {confidenceStateLabel[factor.state]}
                </StatusChip>
              </div>
              <p className="mt-1 t-caption text-ink-2">{factor.detail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <Link
          href={href}
          className="mt-4 flex min-h-(--ps-touch-min) items-center justify-between rounded-sm bg-surface-3 px-3 t-body-sm font-medium text-ink-1"
        >
          What raises this
          <Icon name="chevron-right" size={18} className="text-ink-3" />
        </Link>
      )}
    </Card>
  );
}

/* ==========================================================================
   Named screening risk
   ========================================================================== */

const riskTone: Record<RiskOutput["state"], Tone> = {
  unavailable_by_design: "escalation",
  pending_model: "unavailable",
  insufficient_data: "unavailable",
  externally_generated: "attention",
};

export function RiskCard({ risk }: { risk: RiskOutput }) {
  if (risk.state === "pending_model") {
    return (
      <PendingIntegration
        title={risk.endpoint}
        body={risk.note}
        dependency="assessment contract, reserved pending the model-owner pull requests"
      />
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="t-micro text-ink-3">Screening risk · endpoint</p>
          <h3 className="mt-1 t-title-3 text-ink-1">{risk.endpoint}</h3>
        </div>
        <StatusChip tone={riskTone[risk.state]}>{riskStateLabel[risk.state]}</StatusChip>
      </div>

      {risk.band ? (
        <div className="mt-3 rounded-sm border border-hairline bg-surface-3 p-3">
          <p className="t-title-2 text-ink-1">{risk.band}</p>
          {risk.bandDetail ? <p className="mt-1 t-caption text-ink-2">{risk.bandDetail}</p> : null}
        </div>
      ) : null}

      <p className="mt-3 t-body-sm text-ink-2">{risk.note}</p>

      {risk.generatedContext ? (
        <p className="mt-3 flex items-start gap-2 rounded-sm bg-attention-quiet px-3 py-2.5 t-caption text-attention">
          <Icon name="attention" size={15} className="mt-0.5 shrink-0" />
          {risk.generatedContext}
        </p>
      ) : null}

      <div className="mt-3">
        <MetaList
          items={[
            ...(risk.uncertainty ? [{ label: "Uncertainty", value: risk.uncertainty }] : []),
            ...(risk.modelVersion ? [{ label: "Model version", value: risk.modelVersion }] : []),
            ...(risk.generatedAt ? [{ label: "Generated", value: risk.generatedAt }] : []),
            {
              label: "Missing information",
              value: risk.missing.length === 0 ? "None recorded" : risk.missing.join(", "),
            },
            { label: "Confirmation", value: risk.confirmation },
          ]}
        />
      </div>

      <p className="mt-3 rounded-sm bg-surface-3 px-3 py-2.5 t-body-sm text-ink-1">
        <span className="font-medium">Recommended next action.</span> {risk.nextAction}
      </p>

      <p className="mt-3 t-caption text-ink-3">
        A screening risk is not a diagnosis.
      </p>

      {risk.state === "externally_generated" ? (
        <div className="mt-3">
          <CoachEntry contextId={risk.id} contextLabel={`${risk.endpoint} screening risk`} />
        </div>
      ) : null}
    </Card>
  );
}

/* ==========================================================================
   Evidence
   ========================================================================== */

const reviewTone: Record<EvidenceClaim["reviewStatus"], Tone> = {
  internal_review: "supported",
  clinical_review_pending: "attention",
  research_candidate: "escalation",
};

const directionLabel: Record<EvidenceClaim["direction"], string> = {
  favourable: "Favourable association",
  adverse: "Adverse association",
  measurement: "Measurement modifier",
  context: "Clinical context",
};

export function EvidenceCard({
  claim,
  href,
  compact = false,
}: {
  claim: EvidenceClaim;
  href?: string;
  compact?: boolean;
}) {
  const candidate = claim.reviewStatus === "research_candidate";

  return (
    <Card
      className={cx(
        candidate && "border-dashed border-escalation/50",
      )}
    >
      {/* A research candidate must never be mistaken for an approved claim. */}
      {candidate ? (
        <p className="mb-3 flex items-start gap-2 rounded-sm bg-escalation-quiet px-3 py-2 t-caption text-escalation">
          <Icon name="attention" size={15} className="mt-0.5 shrink-0" />
          Not usable. Source unverified, so this cannot appear in a recommendation.
        </p>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <p className="t-micro text-ink-3">{directionLabel[claim.direction]}</p>
        <StatusChip tone={reviewTone[claim.reviewStatus]}>
          {claim.reviewStatus === "internal_review"
            ? "Reviewed"
            : claim.reviewStatus === "clinical_review_pending"
              ? "Review pending"
              : "Candidate"}
        </StatusChip>
      </div>

      <p className="mt-2 t-prose text-ink-1">{claim.claim}</p>

      {!compact ? (
        <>
          <div className="mt-3">
            <MetaList
              items={[
                { label: "Endpoint studied", value: claim.endpoints.join(", ") },
                { label: "Study type", value: claim.studyType },
                { label: "Population", value: claim.population },
                {
                  label: "Evidence",
                  value: `${confidenceLabel[claim.confidence]} · ${claim.causal ? "interventional" : "observational"}`,
                },
                { label: "Last reviewed", value: claim.lastReviewed },
                { label: "Clinical review", value: reviewStatusLabel[claim.reviewStatus] },
              ]}
            />
          </div>

          <div className="mt-3 border-t border-hairline pt-3">
            <p className="t-micro text-ink-3">Known limitations</p>
            <ul className="mt-1.5 space-y-1.5">
              {claim.limitations.map((limitation) => (
                <li key={limitation} className="flex gap-2 t-body-sm text-ink-2">
                  <Icon name="info" size={15} className="mt-0.5 shrink-0 text-ink-3" />
                  {limitation}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
            {claim.sourceUrl ? (
              <a
                href={claim.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-(--ps-touch-min) items-center gap-1.5 t-body-sm text-accent underline underline-offset-2"
              >
                {claim.source}
                <Icon name="external" size={15} />
              </a>
            ) : (
              <span className="t-body-sm text-ink-3">{claim.source}</span>
            )}
          </div>
        </>
      ) : null}

      {href ? (
        <Link
          href={href}
          className="mt-3 flex min-h-(--ps-touch-min) items-center justify-between rounded-sm bg-surface-3 px-3 t-body-sm font-medium text-ink-1"
        >
          Open evidence card
          <Icon name="chevron-right" size={18} className="text-ink-3" />
        </Link>
      ) : null}
    </Card>
  );
}

/** The citation drawer. Opens over context; never navigates away from it. */
export function CitationButton({ ids, label = "Citations" }: { ids: string[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const claims = ids.map((id) => evidenceById.get(id)).filter((claim): claim is EvidenceClaim => Boolean(claim));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-(--ps-touch-min) items-center gap-2 rounded-sm border border-line-control px-3 py-2 t-body-sm font-medium text-ink-1 hover:bg-surface-3"
      >
        <Icon name="evidence" size={17} className="text-ink-3" />
        {label}
        <span className="t-mono text-ink-3">{claims.length}</span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} eyebrow="Evidence" title="What this is based on">
        <div className="space-y-3">
          {claims.length === 0 ? (
            <p className="t-body-sm text-ink-2">
              No approved evidence is attached. This is labelled general guidance rather than
              evidence-backed.
            </p>
          ) : (
            claims.map((claim) => (
              <EvidenceCard key={claim.id} claim={claim} href={`/evidence/${claim.id}`} compact />
            ))
          )}
        </div>
      </Sheet>
    </>
  );
}

/* ==========================================================================
   Reasoning chain — the signature screen
   --------------------------------------------------------------------------
   Four typed stations on one rail: result, mechanism, action, evidence. The
   numbering is meaningful here, because the argument genuinely runs in order —
   a recommendation is never shown without the result that produced it.
   ========================================================================== */

const stationLabels = ["Your result", "Mechanism", "Bounded action", "Evidence and limits"];

function Station({
  index,
  children,
  last = false,
}: {
  index: number;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <li
      className="relative pl-9"
      style={{ animation: `ps-rise-in var(--ps-duration-slow) var(--ps-ease-out) ${index * 70}ms both` }}
    >
      {/* The rail. Continuous between stations, stopping at the last. */}
      {!last ? (
        <span aria-hidden="true" className="absolute left-[11px] top-7 bottom-0 w-px bg-hairline" />
      ) : null}
      <span
        aria-hidden="true"
        className="absolute left-0 top-1 flex size-[23px] items-center justify-center rounded-full border border-line-control bg-surface-1 t-mono text-ink-2"
      >
        {index + 1}
      </span>
      <p className="t-micro text-ink-3">{stationLabels[index]}</p>
      <div className="mt-1.5 pb-6">{children}</div>
    </li>
  );
}

export function ReasoningChainView({
  chain,
  marker,
  test,
}: {
  chain: ReasoningChain;
  marker: MarkerValue;
  test: ClinicalTest;
}) {
  const definition = markerCatalogue[marker.code];
  const citable = chain.evidenceIds.filter(isCitable);
  const excluded = chain.evidenceIds.filter((id) => !isCitable(id));

  return (
    <ol className="m-0 list-none p-0">
      {/* 1 — the measured result this recommendation answers. */}
      <Station index={0}>
        <div className="rounded-md border border-hairline bg-surface-1 p-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="t-body-sm text-ink-2">{definition.label}</span>
            <span className="flex items-baseline gap-1">
              <span className="t-title-1 text-ink-1">{formatMarker(marker)}</span>
              <span className="t-caption text-ink-3">{definition.unit}</span>
            </span>
          </div>
          <div className="mt-2.5">
            <ReferenceStrip marker={marker} />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {test.source === "simulated" ? <SimulatedBadge compact /> : null}
            <MetaBadge glyph="calendar">{relativeDays(test.collectedAt.slice(0, 10))}</MetaBadge>
          </div>
        </div>

        <Disclosure label="Why this applies to me" glyph="target" defaultOpen>
          <p className="t-prose text-ink-1">{chain.applicability}</p>
          <p className="mt-3 rounded-sm bg-surface-3 px-3 py-2.5 t-body-sm text-ink-2">
            {chain.integrativeNote}
          </p>
        </Disclosure>
      </Station>

      {/* 2 — the biology, in the explanation register. */}
      <Station index={1}>
        <p className="t-prose text-ink-1">{chain.mechanism}</p>
      </Station>

      {/* 3 — one bounded, dated, reversible action. */}
      <Station index={2}>
        <div className="rounded-md border border-accent-line bg-accent-quiet p-3.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="t-title-3 text-ink-1">{chain.action.title}</h3>
            <StatusChip tone="accent" glyph="protocol">
              {categoryLabel[chain.action.category]}
            </StatusChip>
          </div>
          <p className="mt-2 t-body-sm text-ink-2">{chain.action.description}</p>
          <p className="mt-2.5 flex items-start gap-2 t-caption text-ink-2">
            <Icon name="info" size={15} className="mt-0.5 shrink-0 text-accent" />
            {chain.action.bounded}
          </p>
        </div>
      </Station>

      {/* 4 — the sources, their strength, and what they cannot support. */}
      <Station index={3} last>
        <div className="rounded-md border border-hairline bg-surface-1 p-3.5">
          <p className="t-body-sm text-ink-2">
            {citable.length > 0 ? (
              <>
                Backed by {citable.length} internally reviewed{" "}
                {citable.length === 1 ? "source" : "sources"}. Clinical review is not complete for any
                claim in this prototype.
              </>
            ) : (
              <>No approved source matches this action, so it is labelled general guidance.</>
            )}
          </p>

          <div className="mt-3 space-y-2">
            {citable.map((id) => {
              const claim = evidenceById.get(id)!;
              return (
                <Link
                  key={id}
                  href={`/evidence/${id}`}
                  className="block rounded-sm border border-hairline p-3 transition-colors duration-(--ps-duration-fast) hover:bg-surface-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="t-body-sm text-ink-1">{claim.source}</span>
                    <Icon name="chevron-right" size={16} className="mt-0.5 shrink-0 text-ink-3" />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <MetaBadge glyph="info">{confidenceLabel[claim.confidence]}</MetaBadge>
                    <MetaBadge glyph={claim.causal ? "check-circle" : "results"}>
                      {claim.causal ? "Interventional" : "Observational"}
                    </MetaBadge>
                  </div>
                </Link>
              );
            })}
          </div>

          {excluded.length > 0 ? (
            <p className="mt-3 t-caption text-ink-3">
              {excluded.length} referenced {excluded.length === 1 ? "claim is" : "claims are"} excluded
              from recommendations pending verification.
            </p>
          ) : null}

          <Disclosure label="Known limitations" glyph="attention" count={chain.limitations.length}>
            <ul className="space-y-2">
              {chain.limitations.map((limitation) => (
                <li key={limitation} className="flex gap-2 t-body-sm text-ink-2">
                  <Icon name="info" size={15} className="mt-0.5 shrink-0 text-ink-3" />
                  {limitation}
                </li>
              ))}
            </ul>
          </Disclosure>

          {chain.escalation ? (
            <div className="mt-3 rounded-sm border-l-2 border-l-attention bg-attention-quiet p-3">
              <p className="t-micro text-attention">Clinical escalation</p>
              <p className="mt-1 t-body-sm text-ink-1">{chain.escalation}</p>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <CoachEntry contextId={marker.code} contextLabel={`${definition.label} result`} />
          </div>
        </div>
      </Station>
    </ol>
  );
}

/** The entry point onto a reasoning chain from a list. */
export function ReasoningSummaryCard({
  chain,
  marker,
}: {
  chain: ReasoningChain;
  marker: MarkerValue;
}) {
  const definition = markerCatalogue[marker.code];
  const context = referenceContextOf(marker);
  return (
    <Link
      href={`/results/reasoning/${chain.id}`}
      className="block rounded-md border border-hairline bg-surface-1 p-4 shadow-e1 transition-colors duration-(--ps-duration-fast) hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="t-micro text-ink-3">{definition.label}</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="t-title-1 text-ink-1">{formatMarker(marker)}</span>
            <span className="t-caption text-ink-3">{definition.unit}</span>
          </p>
        </div>
        <StatusChip tone={referenceContextTone(context)}>{referenceContextLabel[context]}</StatusChip>
      </div>

      <p className="mt-2.5 t-body-sm text-ink-1">{chain.headline}</p>

      <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3">
        <StatusChip tone="accent" glyph="protocol">
          {categoryLabel[chain.action.category]}
        </StatusChip>
        <span className="min-w-0 flex-1 truncate t-caption text-ink-2">{chain.action.title}</span>
        <Icon name="chevron-right" size={16} className="shrink-0 text-ink-3" />
      </div>
    </Link>
  );
}

/* ==========================================================================
   Protocol
   ========================================================================== */

/**
 * Categories are distinguished by their words, not by seven colours or seven
 * icons. Seven hues would collide with the chart palette and the status roles.
 */
export function CategoryChip({ category }: { category: ProtocolCategory }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xs border border-hairline px-2 py-1 t-micro text-ink-2">
      {categoryLabel[category]}
    </span>
  );
}

export { categoryLabel };
