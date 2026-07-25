"use client";

import { useParams } from "next/navigation";
import { DisclaimerFooter, Screen } from "@/components/shell";
import { ReasoningChainView } from "@/components/domain";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { reasoningChains } from "@/lib/fixtures";
import { usePrototype } from "@/lib/store";

/**
 * PreSeed's signature screen. Four typed stations, disclosed progressively, in
 * the order the argument actually runs.
 */
export default function ReasoningPage() {
  const params = useParams<{ id: string }>();
  const { latestSemen } = usePrototype();
  const chain = reasoningChains.find((candidate) => candidate.id === params.id);

  if (!chain) {
    return (
      <Screen title="Reasoning" back="/results">
        <EmptyState
          glyph="unavailable"
          title="No such reasoning chain"
          body="This chain does not exist, or the result it responds to is no longer on your profile."
          action={<ButtonLink href="/results">Back to results</ButtonLink>}
        />
      </Screen>
    );
  }

  const marker = latestSemen?.markers.find((candidate) => candidate.code === chain.markerCode);

  if (!marker || !latestSemen) {
    return (
      <Screen title="Reasoning" back="/results">
        <Card>
          <h2 className="t-title-3 text-ink-1">This chain needs its measurement</h2>
          <p className="mt-1.5 t-body-sm text-ink-2">
            A recommendation is never shown without the result that produced it. Add a clinical result
            and this chain becomes available.
          </p>
          <ButtonLink href="/tests/new" full className="mt-3" glyph="plus">
            Add a clinical result
          </ButtonLink>
        </Card>
        <DisclaimerFooter />
      </Screen>
    );
  }

  return (
    <Screen title="Why this applies" eyebrow="Parameter reasoning" back="/results">
      <p className="mb-6 t-body-sm text-ink-2">{chain.headline}</p>
      <ReasoningChainView chain={chain} marker={marker} test={latestSemen} />
      <DisclaimerFooter />
    </Screen>
  );
}
