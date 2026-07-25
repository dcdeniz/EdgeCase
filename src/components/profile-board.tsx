"use client";

/**
 * SemenProfile and hormone panel, at a glance.
 *
 * Values keep their reference semantics: position against the limit and a word
 * carry the meaning, and no parameter is rolled into a score. The board is a
 * denser index into the existing marker detail screens, not a new claim.
 */

import Link from "next/link";
import { Icon } from "@/components/icons";
import { Card, MetaBadge, SimulatedBadge, StatusChip, cx } from "@/components/ui";
import {
  hormoneMarkerOrder,
  markerCatalogue,
  plainLabel,
  semenMarkerOrder,
  type ClinicalTest,
  type MarkerCode,
  type MarkerValue,
} from "@/lib/clinical";
import { formatNumber, relativeDays } from "@/lib/format";
import {
  CONTRIBUTOR_CAVEAT,
  isCandidate,
  strengthLabel,
  type Contributor,
} from "@/lib/contributors";
import { evidenceById } from "@/lib/fixtures";
import { NO_CONCEPTION_CLAIM, type SupplementCandidate } from "@/lib/supplements";

/** Below its lower limit, or above its upper limit. */
export function outOfReference(marker: MarkerValue): boolean {
  const definition = markerCatalogue[marker.code];
  const low = marker.referenceLow ?? definition.referenceLow;
  const high = marker.referenceHigh ?? definition.referenceHigh;
  if (definition.shape === "lower_limit") return low != null && marker.value < low;
  if (definition.shape === "upper_limit") return high != null && marker.value > high;
  return (low != null && marker.value < low) || (high != null && marker.value > high);
}

/** The reference limit, phrased the way the approved vocabulary phrases it. */
function referenceText(marker: MarkerValue): string {
  const definition = markerCatalogue[marker.code];
  const low = marker.referenceLow ?? definition.referenceLow;
  const high = marker.referenceHigh ?? definition.referenceHigh;
  if (definition.shape === "lower_limit" && low != null) {
    return `${formatNumber(low, definition.decimals)} or above`;
  }
  if (definition.shape === "upper_limit" && high != null) {
    return `Below ${formatNumber(high, definition.decimals)}`;
  }
  if (low != null && high != null) {
    return `${formatNumber(low, definition.decimals)}–${formatNumber(high, definition.decimals)}`;
  }
  return "Not set";
}

/**
 * One parameter, one row. The name sits alone on its own line in bold — the
 * single most legible thing in the hundred. reference (docs/design/hundred-reference.md)
 * and the reason this replaced a three-column grid of abbreviations.
 */
function MarkerRow({ marker }: { marker: MarkerValue }) {
  const definition = markerCatalogue[marker.code];
  const flagged = outOfReference(marker);

  return (
    <Link
      href={`/results/profile/${marker.code}`}
      className="block border-t border-hairline py-3 first:border-t-0 first:pt-0 hover:bg-surface-3"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          {/* Plain first, clinical term beneath — readable by him, usable by his doctor. */}
          <span className="block t-title-3 text-ink-1">{plainLabel[marker.code]}</span>
          <span className="mt-0.5 block t-mono text-ink-3">{definition.label}</span>
        </span>
        {flagged ? (
          <StatusChip tone="attention" glyph="attention">
            {/* Direction matters: DFI and WBC breach an upper limit, not a lower one. */}
            {definition.shape === "upper_limit" ? "Above range" : "Below range"}
          </StatusChip>
        ) : (
          <Icon name="chevron-right" size={16} className="shrink-0 text-ink-3" />
        )}
      </span>

      <span className="mt-1.5 flex items-baseline gap-3">
        <span className="t-display-2 text-ink-1 ps-num">
          {formatNumber(marker.value, definition.decimals)}
        </span>
        <span className="t-caption text-ink-3">{definition.unit}</span>
        <span className="ml-auto shrink-0 t-mono text-ink-3">
          {referenceText(marker)}
        </span>
      </span>
    </Link>
  );
}

export function SemenProfileBoard({
  test,
  hormones,
}: {
  test: ClinicalTest;
  hormones?: ClinicalTest;
}) {
  const byCode = new Map(test.markers.map((marker) => [marker.code, marker]));
  const hormoneByCode = new Map((hormones?.markers ?? []).map((m) => [m.code, m]));

  const flaggedCount = test.markers.filter(outOfReference).length;

  const renderRows = (codes: MarkerCode[], lookup: Map<MarkerCode, MarkerValue>) =>
    codes.map((code) => {
      const marker = lookup.get(code);
      if (!marker) {
        return (
          <div key={code} className="border-t border-hairline py-3 first:border-t-0 first:pt-0">
            <span className="t-title-3 text-ink-3">{plainLabel[code]}</span>
            <span className="mt-1.5 block t-caption text-ink-3">Not measured</span>
          </div>
        );
      }
      return <MarkerRow key={code} marker={marker} />;
    });

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="t-micro text-ink-3">Semen profile</p>
          <p className="mt-1 t-caption text-ink-2">
            {relativeDays(test.collectedAt.slice(0, 10))}
            {flaggedCount > 0 ? ` · ${flaggedCount} outside range` : null}
          </p>
        </div>
        <SimulatedBadge compact />
      </div>

      <div className="mt-4">{renderRows(semenMarkerOrder, byCode)}</div>

      <p className="mt-5 t-micro text-ink-3">Hormone panel</p>
      <div className="mt-2">
        {hormones ? (
          renderRows(hormoneMarkerOrder.slice(0, 3), hormoneByCode)
        ) : (
          <p className="t-caption text-ink-3">Not on file.</p>
        )}
      </div>
    </Card>
  );
}

/* ==========================================================================
   Contributors
   ========================================================================== */

/**
 * An affected parameter, as a dark pill with a status dot — the pattern from
 * the hundred. supplement screen (docs/design/hundred-reference.md).
 *
 * The dot colours by whether *this user's* value for that parameter currently
 * sits outside its reference, which is the one place colour here carries real
 * information. It is not a pass/fail on the parameter: the word in the profile
 * row above still does that job, and this only says which of the associated
 * parameters are in play for him.
 */
function ParameterPill({ code, flagged }: { code: MarkerCode; flagged: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-inverse px-2.5 py-1">
      <span
        aria-hidden="true"
        className={cx("size-1.5 shrink-0 rounded-full", flagged ? "bg-attention" : "bg-supported")}
      />
      <span className="t-caption text-ink-inverse">{markerCatalogue[code].shortLabel}</span>
      <span className="visually-hidden">
        {flagged ? "outside reference" : "within reference"}
      </span>
    </span>
  );
}

/* ==========================================================================
   Supplement research candidates
   ========================================================================== */

export function SupplementCandidateCard({
  candidate,
  test,
}: {
  candidate: SupplementCandidate;
  test?: ClinicalTest;
}) {
  const flaggedCodes = new Set(
    (test?.markers ?? []).filter(outOfReference).map((marker) => marker.code),
  );

  return (
    <Card className="border-dashed">
      <div className="flex items-start justify-between gap-3">
        <h3 className="t-title-2 text-ink-1">{candidate.name}</h3>
        <StatusChip tone="unavailable" glyph="pending">
          Not recommended
        </StatusChip>
      </div>

      <p className="mt-2 t-body-sm text-ink-2">{candidate.what}</p>

      <p className="mt-3 t-micro text-ink-3">Researched for</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {candidate.discussedFor.map((code) => (
          <ParameterPill key={code} code={code} flagged={flaggedCodes.has(code)} />
        ))}
      </div>

      <div className="mt-3 border-t border-hairline pt-3">
        <p className="t-micro text-ink-3">Dose used in studies</p>
        {/* Deliberately not "suggested use". This is what trials used, not advice. */}
        <p className="mt-1 t-body-sm text-ink-1">{candidate.studiedDose}</p>
      </div>

      <p className="mt-3 t-body-sm text-ink-2">{candidate.rationale}</p>

      <div className="mt-3 border-t border-hairline pt-3">
        <p className="flex gap-2 t-caption text-ink-2">
          <Icon name="attention" size={14} className="mt-0.5 shrink-0 text-attention" />
          {candidate.blocker}
        </p>
        <p className="mt-2 t-caption text-ink-3">{NO_CONCEPTION_CLAIM}</p>
      </div>
    </Card>
  );
}

export function ContributorList({
  contributors,
  test,
  compact = false,
}: {
  contributors: Contributor[];
  /** Used only to colour the parameter dots. Optional — dots default to neutral. */
  test?: ClinicalTest;
  compact?: boolean;
}) {
  if (contributors.length === 0) {
    return (
      <p className="t-body-sm text-ink-2">
        Nothing in your record maps to an approved association here.
      </p>
    );
  }

  const flaggedCodes = new Set(
    (test?.markers ?? []).filter(outOfReference).map((marker) => marker.code),
  );

  return (
    <div>
      {/* Each contributor is its own card, not a row in a list. */}
      <div className="space-y-3">
        {contributors.map((contributor) => {
          const claim = evidenceById.get(contributor.evidenceId);
          const candidate = isCandidate(contributor);
          return (
            <Card key={contributor.id} className={cx(candidate && "border-dashed")}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="t-title-3 text-ink-1">{contributor.label}</h3>
                <span className="shrink-0 t-mono text-ink-3">{contributor.yourValue}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <MetaBadge glyph={candidate ? "pending" : "results"}>
                  {strengthLabel[contributor.strength]}
                </MetaBadge>
                <MetaBadge glyph="hand">{contributor.source}</MetaBadge>
              </div>

              <p className="mt-3 t-micro text-ink-3">Associated with</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {contributor.affects.map((code) => (
                  <ParameterPill key={code} code={code} flagged={flaggedCodes.has(code)} />
                ))}
              </div>

              {!compact ? (
                <p className="mt-3 t-body-sm text-ink-2">{contributor.mechanism}</p>
              ) : null}

              {claim ? (
                <Link
                  href={`/evidence/${claim.id}`}
                  className="mt-3 inline-flex items-center gap-1 t-body-sm font-medium text-accent"
                >
                  {claim.source}
                  <Icon name="chevron-right" size={14} />
                </Link>
              ) : null}

              {candidate ? (
                <p className="mt-1.5 t-caption text-ink-3">Not cleared for recommendations.</p>
              ) : null}
            </Card>
          );
        })}
      </div>

      <p className="mt-3 t-caption text-ink-3">{CONTRIBUTOR_CAVEAT}</p>
    </div>
  );
}
