"use client";

import { DisclaimerFooter, Screen } from "@/components/shell";
import { EmptyState } from "@/components/ui";
import { OverallRankCard, RankBreakdown } from "@/components/percentile";
import { usePrototype } from "@/lib/store";

/**
 * Where the user's measurements sit in the WHO reference distribution.
 *
 * The overall figure leads because that is what a reader wants first; the
 * per-parameter ranks and their distribution curves sit beneath it, which
 * keeps the home screen to one number instead of six.
 */
export default function RankPage() {
  const { latestSemen } = usePrototype();

  if (!latestSemen) {
    return (
      <Screen title="Your rank" back="/today">
        <EmptyState
          glyph="unavailable"
          title="No analysis on file"
          body="A rank needs a measured semen analysis to place against the reference distribution."
        />
        <DisclaimerFooter />
      </Screen>
    );
  }

  return (
    <Screen title="Your rank" eyebrow="WHO reference population" back="/today">
      <OverallRankCard test={latestSemen} />

      <div className="mt-4">
        <RankBreakdown test={latestSemen} />
      </div>

      <DisclaimerFooter />
    </Screen>
  );
}
