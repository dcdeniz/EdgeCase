"use client";

/**
 * Compact protocol list.
 *
 * One line per action: what it is, what it targets, and what the Seed Score
 * headroom is in the domain it moves.
 *
 * The headroom figure is attached to the DOMAIN, shown once per group, not to
 * each action. Three sleep actions compete for the same points; printing a
 * number beside each would sum to a total the model cannot deliver.
 */

import Link from "next/link";
import { Icon } from "@/components/icons";
import { Card, MetaBadge, StatusChip, cx } from "@/components/ui";
import { markerCatalogue } from "@/lib/clinical";
import { categoryLabel, type ProtocolCategory, type ProtocolItem } from "@/lib/fixtures";
import { domainColour, type BehaviourDomainId } from "@/lib/behaviour-score";

/** Which behaviour domain an action moves. Null where the score cannot see it. */
export const categoryDomain: Record<ProtocolCategory, BehaviourDomainId | null> = {
  nutrition: "diet",
  exercise: "activity",
  sleep: "sleep",
  supplement: null,
  exposure: null,
  lifestyle: null,
  clinical_navigation: null,
};

export function ProtocolGroup({
  category,
  items,
  headroom,
}: {
  category: ProtocolCategory;
  items: ProtocolItem[];
  headroom?: number;
}) {
  if (items.length === 0) return null;
  const domain = categoryDomain[category];

  return (
    <section className="mt-5" aria-labelledby={`group-${category}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 id={`group-${category}`} className="flex items-center gap-2 t-title-2 text-ink-1">
          {domain ? (
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: domainColour[domain] }}
            />
          ) : null}
          {categoryLabel[category]}
        </h3>
        {domain && headroom != null && headroom > 0 ? (
          <span className="shrink-0 t-caption text-ink-2">
            up to <span className="font-medium text-ink-1">+{headroom}</span> Seed Score
          </span>
        ) : null}
      </div>

      <Card className="p-0">
        {items.map((item, index) => (
          <Link
            key={item.id}
            href={item.reasoningId ? `/results/reasoning/${item.reasoningId}` : "/protocol"}
            className={cx(
              "flex items-center gap-3 px-4 py-3.5",
              index > 0 && "border-t border-hairline",
              "hover:bg-surface-3",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block t-title-3 text-ink-1">{item.title}</span>
              <span className="mt-0.5 block truncate t-caption text-ink-3">
                {item.description}
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {item.markerCode ? (
                  <MetaBadge glyph="target">
                    {markerCatalogue[item.markerCode].label}
                  </MetaBadge>
                ) : null}
                {item.evidenceStatus === "general_guidance" ? (
                  <MetaBadge glyph="info">General guidance</MetaBadge>
                ) : null}
              </span>
            </span>
            <Icon name="chevron-right" size={17} className="shrink-0 text-ink-3" />
          </Link>
        ))}
      </Card>

      {!domain ? (
        <p className="mt-1.5 t-caption text-ink-3">
          Not one of the four scored domains, so this does not move your Seed Score.
        </p>
      ) : null}
    </section>
  );
}

export function ProtocolHeadline({
  days,
  outOfRange,
}: {
  days: number;
  outOfRange: number;
}) {
  return (
    <>
      <h2 className="t-display-2 text-ink-1">{days} Day Protocol</h2>
      <p className="mt-2 t-body text-ink-2">
        {outOfRange > 0
          ? `How to target the ${outOfRange} parameters sitting below their reference range.`
          : "Dated actions, each tied to a result and a citation."}
      </p>
      <p className="mt-3">
        <StatusChip tone="information" glyph="info">
          Direction, not a predicted number
        </StatusChip>
      </p>
    </>
  );
}
