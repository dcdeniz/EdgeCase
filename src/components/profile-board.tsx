"use client";

/**
 * SemenProfile and hormone panel, at a glance.
 *
 * Values keep their reference semantics: position against the limit and a word
 * carry the meaning, and no parameter is rolled into a score. The board is a
 * denser index into the existing marker detail screens, not a new claim.
 */

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Card, MetaBadge, MetaList, Sheet, SimulatedBadge, StatusChip, cx } from "@/components/ui";
import {
  hormoneMarkerOrder,
  markerCatalogue,
  plainMeaning,
  referenceSets,
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

export type ReferenceBand = "below" | "within" | "optimal";

export const bandLabel: Record<ReferenceBand, string> = {
  below: "Below range",
  within: "In range",
  optimal: "Optimal",
};

/**
 * Which band a value falls in.
 *
 * For an upper-limit marker (DFI, white cells) there is no optimal band —
 * being under the threshold is simply within range, and above it is out.
 */
export function bandOf(marker: MarkerValue): ReferenceBand {
  const definition = markerCatalogue[marker.code];
  const low = marker.referenceLow ?? definition.referenceLow;
  const high = marker.referenceHigh ?? definition.referenceHigh;

  if (definition.shape === "upper_limit") {
    return high != null && marker.value > high ? "below" : "within";
  }
  if (low != null && marker.value < low) return "below";
  if (definition.referenceMedian != null && marker.value >= definition.referenceMedian) {
    return "optimal";
  }
  return "within";
}

const bandColour: Record<ReferenceBand, string> = {
  below: "var(--ps-escalation)",
  within: "var(--ps-information)",
  optimal: "var(--ps-supported)",
};

/**
 * Where the value sits against its reference, as a filled bar.
 *
 * Colour here is a deliberate departure from the original rule that no
 * red/green scoring appears on a clinical value (ADR 0007). The word is kept
 * beside the bar so colour is never the sole carrier, and the "optimal" edge
 * is drawn from an unverified population median — it is a presentational
 * band, and nothing in the product scores off it.
 */
function ReferenceBar({ marker }: { marker: MarkerValue }) {
  const definition = markerCatalogue[marker.code];
  const band = bandOf(marker);
  const low = marker.referenceLow ?? definition.referenceLow;
  const high = marker.referenceHigh ?? definition.referenceHigh;

  // Scale: headroom past the median, or past the upper limit for capped markers.
  const scaleMax =
    definition.shape === "upper_limit"
      ? Math.max((high ?? 1) * 2, marker.value * 1.15)
      : Math.max((definition.referenceMedian ?? (low ?? 1) * 3) * 1.35, marker.value * 1.1);

  const position = Math.max(2, Math.min(100, (marker.value / scaleMax) * 100));
  const lowMark = low == null ? null : (low / scaleMax) * 100;
  const medianMark =
    definition.referenceMedian == null ? null : (definition.referenceMedian / scaleMax) * 100;
  const highMark = high == null ? null : (high / scaleMax) * 100;

  return (
    <span className="mt-2 block">
      <span className="relative block h-1.5 overflow-hidden rounded-full bg-surface-3">
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${position}%`, background: bandColour[band] }}
        />
        {/* Threshold ticks, so the bar is readable without the legend. */}
        {[lowMark, medianMark, highMark].map((mark, index) =>
          mark == null || mark >= 100 ? null : (
            <span
              key={index}
              aria-hidden="true"
              className="absolute inset-y-0 w-px bg-[var(--ps-ink-3)]"
              style={{ left: `${mark}%` }}
            />
          ),
        )}
      </span>
      <span className="mt-1.5 flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ background: bandColour[band] }}
        />
        <span className="t-caption text-ink-2">{bandLabel[band]}</span>
      </span>
    </span>
  );
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
function MarkerRow({
  marker,
  onExplain,
}: {
  marker: MarkerValue;
  onExplain: (code: MarkerCode) => void;
}) {
  const definition = markerCatalogue[marker.code];

  /*
   * The row is a link and the help control is a button, so they are siblings
   * rather than nested. A button inside an anchor is invalid and would make
   * the explanation unreachable by keyboard.
   */
  return (
    <div className="flex items-start gap-2 border-t border-hairline py-3 first:border-t-0 first:pt-0">
      <Link
        href={`/results/profile/${marker.code}`}
        className="min-w-0 flex-1 rounded-sm hover:bg-surface-3"
      >
        {/* The name gets the full width of the row; nothing shares its line. */}
        <span className="block t-title-3 text-ink-1">{definition.label}</span>

        <span className="mt-1.5 flex items-baseline gap-3">
          <span className="t-display-2 text-ink-1 ps-num">
            {formatNumber(marker.value, definition.decimals)}
          </span>
          <span className="t-caption text-ink-3">{definition.unit}</span>
          <span className="ml-auto shrink-0 t-mono text-ink-3">{referenceText(marker)}</span>
        </span>

        {/* The bar replaces the warning chip: same information, no alarm glyph. */}
        <ReferenceBar marker={marker} />
      </Link>

      <button
        type="button"
        onClick={() => onExplain(marker.code)}
        aria-label={`What ${definition.label} means`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-surface-3 hover:text-ink-1"
      >
        <Icon name="help" size={19} />
      </button>
    </div>
  );
}

/** The explanation sheet behind each row's question mark. */
function MarkerExplainer({
  code,
  marker,
  onClose,
}: {
  code: MarkerCode;
  marker?: MarkerValue;
  onClose: () => void;
}) {
  const definition = markerCatalogue[code];
  const set = referenceSets[definition.referenceSet];

  return (
    <Sheet open onClose={onClose} eyebrow="What this measures" title={definition.label}>
      <p className="t-prose text-ink-1">{plainMeaning[code]}</p>

      <div className="mt-4 border-t border-hairline pt-3">
        <p className="t-micro text-ink-3">In more detail</p>
        <p className="mt-1.5 t-body-sm text-ink-2">{definition.meaning}</p>
      </div>

      <div className="mt-4 border-t border-hairline pt-3">
        <MetaList
          items={[
            { label: "Unit", value: definition.unit },
            {
              label: "Reference",
              value: marker ? referenceText(marker) : "—",
              hint: set?.label,
            },
            ...(marker
              ? [{ label: "Your value", value: formatNumber(marker.value, definition.decimals) }]
              : []),
          ]}
        />
      </div>

      {set ? (
        <p className="mt-3 t-caption text-ink-2">{set.note}</p>
      ) : null}

      {definition.specialistOnly ? (
        <p className="mt-3">
          <StatusChip tone="information" glyph="info">
            Specialist assay
          </StatusChip>
        </p>
      ) : null}
    </Sheet>
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
  const [explaining, setExplaining] = useState<MarkerCode | null>(null);

  const renderRows = (codes: MarkerCode[], lookup: Map<MarkerCode, MarkerValue>) =>
    codes.map((code) => {
      const marker = lookup.get(code);
      if (!marker) {
        return (
          <div
            key={code}
            className="flex items-start gap-2 border-t border-hairline py-3 first:border-t-0 first:pt-0"
          >
            <span className="min-w-0 flex-1">
              <span className="t-title-3 text-ink-3">{markerCatalogue[code].label}</span>
              <span className="mt-1.5 block t-caption text-ink-3">Not measured</span>
            </span>
            <button
              type="button"
              onClick={() => setExplaining(code)}
              aria-label={`What ${markerCatalogue[code].label} means`}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-surface-3 hover:text-ink-1"
            >
              <Icon name="help" size={19} />
            </button>
          </div>
        );
      }
      return <MarkerRow key={code} marker={marker} onExplain={setExplaining} />;
    });

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="t-micro text-ink-3">Semen profile</p>
          <p className="mt-1 t-caption text-ink-2">
            {relativeDays(test.collectedAt.slice(0, 10))}
            {flaggedCount > 0 ? ` · ${flaggedCount} below range` : null}
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

      {explaining ? (
        <MarkerExplainer
          code={explaining}
          marker={byCode.get(explaining) ?? hormoneByCode.get(explaining)}
          onClose={() => setExplaining(null)}
        />
      ) : null}
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
