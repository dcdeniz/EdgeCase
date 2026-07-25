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

/** Below its lower limit, or above its upper limit. */
export function outOfReference(marker: MarkerValue): boolean {
  const definition = markerCatalogue[marker.code];
  const low = marker.referenceLow ?? definition.referenceLow;
  const high = marker.referenceHigh ?? definition.referenceHigh;
  if (definition.shape === "lower_limit") return low != null && marker.value < low;
  if (definition.shape === "upper_limit") return high != null && marker.value > high;
  return (low != null && marker.value < low) || (high != null && marker.value > high);
}

function MarkerCell({ marker }: { marker: MarkerValue }) {
  const definition = markerCatalogue[marker.code];
  const flagged = outOfReference(marker);

  return (
    <Link
      href={`/results/profile/${marker.code}`}
      className={cx(
        "block rounded-sm border p-2.5",
        flagged ? "border-attention/40 bg-attention-quiet" : "border-hairline bg-surface-1",
        "transition-colors duration-(--ps-duration-fast) hover:bg-surface-3",
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="t-micro text-ink-3">{definition.shortLabel}</span>
        {flagged ? (
          <Icon name="attention" size={12} className="shrink-0 text-attention" />
        ) : null}
      </span>
      <span className="mt-1 block t-title-2 text-ink-1 ps-num">
        {formatNumber(marker.value, definition.decimals)}
        <span className="ml-1 t-caption font-normal text-ink-3">{definition.unit}</span>
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

  const renderRow = (codes: MarkerCode[], lookup: Map<MarkerCode, MarkerValue>) =>
    codes.map((code) => {
      const marker = lookup.get(code);
      if (!marker) {
        return (
          <div
            key={code}
            className="rounded-sm border border-dashed border-hairline p-2.5 opacity-70"
          >
            <span className="t-micro text-ink-3">{markerCatalogue[code].shortLabel}</span>
            <span className="mt-1 block t-title-3 text-ink-3">—</span>
          </div>
        );
      }
      return <MarkerCell key={code} marker={marker} />;
    });

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="t-micro text-ink-3">Semen profile</p>
          <p className="mt-1 t-caption text-ink-2">{relativeDays(test.collectedAt.slice(0, 10))}</p>
        </div>
        <SimulatedBadge compact />
      </div>

      {flaggedCount > 0 ? (
        <p className="mt-2.5">
          <StatusChip tone="attention" glyph="attention">
            {flaggedCount} below reference
          </StatusChip>
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-3 gap-2">{renderRow(semenMarkerOrder, byCode)}</div>

      {hormones ? (
        <>
          <p className="mt-4 t-micro text-ink-3">Hormone panel</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {renderRow(hormoneMarkerOrder.slice(0, 3), hormoneByCode)}
          </div>
        </>
      ) : (
        <p className="mt-3 t-caption text-ink-3">
          No hormone panel on file. FSH, LH and testosterone give endocrine context.
        </p>
      )}
    </Card>
  );
}

/* ==========================================================================
   Contributors
   ========================================================================== */

export function ContributorList({
  contributors,
  compact = false,
}: {
  contributors: Contributor[];
  compact?: boolean;
}) {
  if (contributors.length === 0) {
    return (
      <p className="t-body-sm text-ink-2">
        Nothing in your record maps to an approved association for this parameter.
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-2">
        {contributors.map((contributor) => {
          const claim = evidenceById.get(contributor.evidenceId);
          const candidate = isCandidate(contributor);
          return (
            <li
              key={contributor.id}
              className={cx(
                "rounded-sm border p-2.5",
                candidate ? "border-dashed border-hairline" : "border-hairline bg-surface-1",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="t-body-sm font-medium text-ink-1">{contributor.label}</span>
                <span className="shrink-0 t-mono text-ink-3">{contributor.yourValue}</span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <MetaBadge glyph={candidate ? "pending" : "results"}>
                  {strengthLabel[contributor.strength]}
                </MetaBadge>
                <MetaBadge glyph="hand">{contributor.source}</MetaBadge>
              </div>

              {!compact ? (
                <p className="mt-2 t-caption text-ink-2">{contributor.mechanism}</p>
              ) : null}

              {claim ? (
                <Link
                  href={`/evidence/${claim.id}`}
                  className="mt-2 inline-flex items-center gap-1 t-caption font-medium text-accent"
                >
                  {claim.source}
                  <Icon name="chevron-right" size={13} />
                </Link>
              ) : null}

              {candidate ? (
                <p className="mt-1.5 t-caption text-ink-3">
                  Not cleared for recommendations.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 t-caption text-ink-3">{CONTRIBUTOR_CAVEAT}</p>
    </div>
  );
}
