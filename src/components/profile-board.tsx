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
  centileLabel,
  CENTILE_CAVEAT,
  markerCatalogue,
  plainMeaning,
  referenceSets,
  semenMarkerOrder,
  type ClinicalTest,
  type MarkerCode,
  type MarkerValue,
} from "@/lib/clinical";
import { formatNumber, relativeDays } from "@/lib/format";
import { formatAgeGap, spermAge } from "@/lib/wearable";
import {
  CONTRIBUTOR_CAVEAT,
  isCandidate,
  strengthLabel,
  type Contributor,
} from "@/lib/contributors";
import { evidenceById } from "@/lib/fixtures";
import {
  NO_CONCEPTION_CLAIM,
  supplementProducts,
  type SupplementCandidate,
  type SupplementProduct,
} from "@/lib/supplements";

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
 * Three bands, all anchored to WHO Table 8.3: below the 5th centile, between
 * the 5th and the 50th, and at or above the median of the reference
 * population. The optimal band was removed while the median was unverified and
 * is restored now the manual's own table is in the catalogue.
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
 * red/green scoring appears on a clinical value. The band word is kept beside
 * the bar so colour is never the sole carrier, and both thresholds are the
 * verified WHO 5th-centile limits.
 */
function ReferenceBar({ marker, centile }: { marker: MarkerValue; centile?: string | null }) {
  const definition = markerCatalogue[marker.code];
  const band = bandOf(marker);
  const low = marker.referenceLow ?? definition.referenceLow;
  const high = marker.referenceHigh ?? definition.referenceHigh;

  // Scale gives headroom past the limit so a value at the limit is not pinned.
  const scaleMax =
    definition.shape === "upper_limit"
      ? Math.max((high ?? 1) * 2, marker.value * 1.15)
      : Math.max((low ?? 1) * 2.6, marker.value * 1.1);

  const position = Math.max(2, Math.min(100, (marker.value / scaleMax) * 100));
  const lowMark = low == null ? null : (low / scaleMax) * 100;
  const highMark = high == null ? null : (high / scaleMax) * 100;

  return (
    <span className="mt-2 block">
      <span className="relative block h-1.5 overflow-hidden rounded-full bg-surface-3">
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${position}%`, background: bandColour[band] }}
        />
        {/* Threshold ticks, so the bar is readable without the legend. */}
        {[lowMark, highMark].map((mark, index) =>
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
      <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full"
            style={{ background: bandColour[band] }}
          />
          <span className="t-caption text-ink-2">{bandLabel[band]}</span>
        </span>
        {centile ? <span className="t-caption text-ink-3">· {centile}</span> : null}
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
  baseline,
  onExplain,
}: {
  marker: MarkerValue;
  /** Same marker at baseline, for the change figure. */
  baseline?: MarkerValue;
  onExplain: (code: MarkerCode) => void;
}) {
  const definition = markerCatalogue[marker.code];
  const centile = centileLabel(marker.code, marker.value);
  const change =
    baseline && baseline.value !== 0
      ? Math.round(((marker.value - baseline.value) / baseline.value) * 100)
      : null;

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
          <span className="ml-auto shrink-0 text-right">
            {change != null ? (
              <span
                className={cx(
                  "block t-body-sm font-medium",
                  change > 0 ? "text-accent" : change < 0 ? "text-attention" : "text-ink-2",
                )}
              >
                {change > 0 ? "+" : change < 0 ? "−" : ""}
                {Math.abs(change)}%
              </span>
            ) : null}
            <span className="block t-mono text-ink-3">
              {change != null ? "since baseline" : referenceText(marker)}
            </span>
          </span>
        </span>

        {/* The bar replaces the warning chip: same information, no alarm glyph. */}
        <ReferenceBar marker={marker} centile={centile} />
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

      {marker && centileLabel(code, marker.value) ? (
        <div className="mt-3 border-t border-hairline pt-3">
          <p className="t-micro text-ink-3">Where you sit</p>
          <p className="mt-1 t-title-2 text-ink-1">{centileLabel(code, marker.value)}</p>
          <p className="mt-1.5 t-caption text-ink-2">{CENTILE_CAVEAT}</p>
        </div>
      ) : null}

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
  baseline,
}: {
  test: ClinicalTest;
  hormones?: ClinicalTest;
  /** Earlier analysis, so each row can show change since baseline. */
  baseline?: ClinicalTest;
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
      return (
        <MarkerRow
          key={code}
          marker={marker}
          baseline={baseline?.markers.find((row) => row.code === code)}
          onExplain={setExplaining}
        />
      );
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

/**
 * A named product, laid out like the reference supplement screen: plain
 * opener, suggested use, what it is positioned against, scientific rationale.
 *
 * The differences from that reference are the point. The evidence level is
 * quoted as the manufacturer characterises it, the limitations name the gap
 * between what the product is studied for and what this app measures, and the
 * card is marked as information rather than a recommendation.
 */
export function ProductCard({ product }: { product: SupplementProduct }) {
  return (
    <Card className="border-dashed">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="t-micro text-ink-3">{product.brand}</p>
          <h3 className="mt-1 t-title-2 text-ink-1">{product.name}</h3>
          <p className="mt-0.5 t-caption text-ink-2">{product.tagline}</p>
        </div>
        <StatusChip tone="unavailable" glyph="pending">
          Information only
        </StatusChip>
      </div>

      <p className="mt-3 t-prose text-ink-1">{product.what}</p>

      <div className="mt-4 border-t border-hairline pt-3">
        <p className="t-micro text-ink-3">Suggested use</p>
        <p className="mt-1 t-body-sm text-ink-1">{product.suggestedUse}</p>
      </div>

      <div className="mt-4 border-t border-hairline pt-3">
        <p className="t-micro text-ink-3">Positioned against</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {product.positivelyImpacts.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-inverse px-2.5 py-1"
            >
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-information" />
              <span className="t-caption text-ink-inverse">{item}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-hairline pt-3">
        <p className="t-micro text-ink-3">Scientific rationale</p>
        <p className="mt-1 t-body-sm text-ink-2">{product.scientificRationale}</p>
        <ul className="mt-2.5 space-y-1">
          {product.ingredients.map((item) => (
            <li key={item} className="t-mono text-ink-3">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 border-t border-hairline pt-3">
        <p className="flex gap-2 t-caption text-ink-2">
          <Icon name="attention" size={14} className="mt-0.5 shrink-0 text-attention" />
          {product.evidenceLevel}
        </p>
        <ul className="mt-2 space-y-1.5">
          {product.limitations.map((line) => (
            <li key={line} className="flex gap-2 t-caption text-ink-3">
              <Icon name="info" size={13} className="mt-0.5 shrink-0" />
              {line}
            </li>
          ))}
        </ul>
        <a
          href={product.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 t-body-sm font-medium text-accent"
        >
          Manufacturer&rsquo;s science page
          <Icon name="external" size={14} />
        </a>
      </div>
    </Card>
  );
}

/**
 * Sperm Epigenetic Age.
 *
 * Real, published science — a DNA-methylation clock associated with time to
 * pregnancy (Hum Reprod, 379 men). It is rendered as PENDING rather than as a
 * number because it requires a methylation assay on a sperm sample and cannot
 * be derived from lifestyle data. Producing an "age" from sleep and diet logs
 * would be inventing a measurement, which is the one thing this product must
 * not do.
 */
export function SpermAgeCard() {
  const age = spermAge();
  const older = age.differenceYears >= 0;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="t-micro text-ink-3">Sperm Epigenetic Age</p>
        <SimulatedBadge compact />
      </div>

      <p className="mt-4 text-center t-display-1 text-ink-1 ps-num">{age.epigeneticAge}</p>
      <p className="mx-auto mt-2 max-w-[18rem] text-center t-body text-ink-2">
        That&rsquo;s {formatAgeGap(age.differenceYears)}.
      </p>

      <div className="mt-4 flex items-center justify-center gap-6 border-t border-hairline pt-3">
        <span className="text-center">
          <span className="block t-micro text-ink-3">Your age</span>
          <span className="mt-0.5 block t-title-2 text-ink-1 ps-num">{age.chronologicalAge}</span>
        </span>
        <span className="text-center">
          <span className="block t-micro text-ink-3">Sperm reads</span>
          <span className="mt-0.5 block t-title-2 text-ink-1 ps-num">{age.epigeneticAge}</span>
        </span>
      </div>

      <div className="mt-4 border-t border-hairline pt-3">
        <p className="t-body-sm text-ink-2">
          A DNA-methylation measure of how old your sperm looks biologically. Higher sperm
          epigenetic age has been associated with a longer time to pregnancy, and is higher in men
          who smoke.
        </p>
        <ul className="mt-2.5 space-y-1.5">
          <li className="flex gap-2 t-caption text-ink-3">
            <Icon name="info" size={13} className="mt-0.5 shrink-0" />
            From a simulated methylation assay. It cannot be derived from sleep, diet or activity.
          </li>
          <li className="flex gap-2 t-caption text-ink-3">
            <Icon name="info" size={13} className="mt-0.5 shrink-0" />
            {older
              ? "Reading older is an association with time to pregnancy, not a diagnosis and not a prediction about you."
              : "Reading younger is an association only, and does not predict conception."}
          </li>
          <li className="flex gap-2 t-caption text-ink-3">
            <Icon name="info" size={13} className="mt-0.5 shrink-0" />
            No protocol action in this app has been shown to move it.
          </li>
        </ul>
        <a
          href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9247414/"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 t-body-sm font-medium text-accent"
        >
          Sperm epigenetic clock and pregnancy outcomes
          <Icon name="external" size={14} />
        </a>
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

      {/* Products offered against a contributor the user actually has. */}
      {supplementProducts
        .filter((product) => contributors.some((c) => c.id === product.contributorId))
        .map((product) => (
          <div key={product.id} className="mt-3">
            <ProductCard product={product} />
          </div>
        ))}

      <p className="mt-3 t-caption text-ink-3">{CONTRIBUTOR_CAVEAT}</p>
    </div>
  );
}
