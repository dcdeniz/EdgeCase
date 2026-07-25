"use client";

import { useParams } from "next/navigation";
import { DisclaimerFooter, Screen } from "@/components/shell";
import { CoachEntry, EvidenceCard } from "@/components/domain";
import { ButtonLink, Card, EmptyState, SectionHeader } from "@/components/ui";
import { evidenceById, protocolTemplate, reasoningChains } from "@/lib/fixtures";

export default function EvidenceDetailPage() {
  const params = useParams<{ id: string }>();
  const claim = evidenceById.get(params.id);

  if (!claim) {
    return (
      <Screen title="Evidence" back="/evidence">
        <EmptyState
          glyph="unavailable"
          title="No such evidence card"
          body="That claim is not in the registry."
          action={<ButtonLink href="/evidence">Back to the library</ButtonLink>}
        />
      </Screen>
    );
  }

  const usedByItems = protocolTemplate.filter((item) => item.evidenceIds.includes(claim.id));
  const usedByChains = reasoningChains.filter((chain) => chain.evidenceIds.includes(claim.id));

  return (
    <Screen title="Evidence card" eyebrow={claim.studyType.split(",")[0]} back="/evidence">
      <EvidenceCard claim={claim} />

      {usedByChains.length > 0 || usedByItems.length > 0 ? (
        <section className="mt-6" aria-labelledby="used-by">
          <SectionHeader id="used-by" eyebrow="In your account" title="Where this is used" />
          <Card>
            {usedByChains.length > 0 ? (
              <>
                <p className="t-micro text-ink-3">Reasoning chains</p>
                <ul className="mt-1.5 space-y-1.5">
                  {usedByChains.map((chain) => (
                    <li key={chain.id}>
                      <ButtonLink href={`/results/reasoning/${chain.id}`} variant="quiet" size="md">
                        {chain.headline}
                      </ButtonLink>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {usedByItems.length > 0 ? (
              <div className={usedByChains.length > 0 ? "mt-3 border-t border-hairline pt-3" : undefined}>
                <p className="t-micro text-ink-3">Protocol actions</p>
                <ul className="mt-1.5 space-y-1.5">
                  {usedByItems.map((item) => (
                    <li key={item.id} className="t-body-sm text-ink-2">
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        </section>
      ) : (
        <Card className="mt-4">
          <p className="t-body-sm text-ink-2">
            This claim is not currently attached to anything in your account. It is here as context.
          </p>
        </Card>
      )}

      <div className="mt-5">
        <CoachEntry contextId={claim.id} contextLabel={`Evidence: ${claim.source}`} />
      </div>

      <DisclaimerFooter />
    </Screen>
  );
}
