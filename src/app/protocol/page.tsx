"use client";

import { DisclaimerFooter, Screen } from "@/components/shell";
import {
  AdaptationProposal,
  ConsistencyCard,
  ProtocolAction,
  ProtocolProgress,
  ProtocolTimeline,
  RetestPrompt,
} from "@/components/protocol";
import {
  Button,
  ButtonLink,
  Card,
  Disclosure,
  EmptyState,
  MetaList,
  SectionHeader,
  StatusChip,
} from "@/components/ui";
import { categoryLabel, type ProtocolCategory } from "@/lib/fixtures";
import { formatDate } from "@/lib/format";
import { itemsForWeek, protocolWeek, usePrototype } from "@/lib/store";
import { SupplementCandidateCard, outOfReference } from "@/components/profile-board";
import { ProtocolGroup, ProtocolHeadline, categoryDomain } from "@/components/protocol-list";
import { domainHeadroom } from "@/lib/what-if";
import { SUPPLEMENT_DISCLAIMER, supplementCandidates } from "@/lib/supplements";

const categories = Object.keys(categoryLabel) as ProtocolCategory[];

export default function ProtocolPage() {
  const { state, latestSemen, seedDemo } = usePrototype();
  const protocol = state.protocol;

  if (!protocol) {
    return (
      <Screen title="Protocol">
        <EmptyState
          glyph="protocol"
          title="No active protocol"
          body="A protocol is dated from a measured result, so the plan responds to something real. It usually runs about 100 days and ends with a scheduled analysis."
          action={
            <div className="flex flex-col gap-2">
              <ButtonLink href="/tests/new" glyph="plus">
                Add a clinical result
              </ButtonLink>
              <Button variant="quiet" onClick={() => seedDemo("baseline")}>
                Load the demo baseline instead
              </Button>
            </div>
          }
        />
        <DisclaimerFooter />
      </Screen>
    );
  }

  const week = protocolWeek(protocol);
  const currentItems = itemsForWeek(protocol, week);
  const outOfRange = (latestSemen?.markers ?? []).filter(outOfReference).length;

  const headroomByCategory = Object.fromEntries(
    categories.map((category) => {
      const domain = categoryDomain[category];
      return [category, domain ? domainHeadroom(state, domain).available : undefined];
    }),
  ) as Record<ProtocolCategory, number | undefined>;

  return (
    <Screen title="Protocol" eyebrow={`Version ${protocol.version}`}>
      {state.adaptation ? (
        <div className="mb-4">
          <AdaptationProposal />
        </div>
      ) : null}

      <ProtocolProgress protocol={protocol} />

      <div className="mt-4">
        <RetestPrompt protocol={protocol} />
      </div>

      <section className="mt-6" aria-labelledby="this-week">
        <SectionHeader
          id="this-week"
          eyebrow={`Week ${week}`}
          title="Current actions"
          action={<StatusChip tone="neutral">{currentItems.length} active</StatusChip>}
        />
        <div className="space-y-3">
          {currentItems.map((item) => (
            <ProtocolAction key={item.id} item={item} />
          ))}
        </div>
      </section>

      <div className="mt-6">
        <ConsistencyCard />
      </div>

      <section className="mt-6" aria-labelledby="timeline">
        <SectionHeader id="timeline" eyebrow="Full plan" title="Week by week" />
        <ProtocolTimeline protocol={protocol} />
      </section>

      <section className="mt-6" aria-labelledby="details">
        <SectionHeader id="details" eyebrow="This protocol" title="Details" level={3} />
        <Card>
          <MetaList
            items={[
              { label: "Version", value: `v${protocol.version}` },
              { label: "Length", value: `${protocol.days} days` },
              { label: "Starts", value: formatDate(protocol.startsOn) },
              { label: "Ends", value: formatDate(protocol.endsOn) },
              { label: "Retest due", value: formatDate(protocol.retestDueOn) },
              { label: "Actions", value: `${protocol.items.length}` },
            ]}
          />
          <p className="mt-3 border-t border-hairline pt-3 t-body-sm text-ink-2">{protocol.rationale}</p>
        </Card>
      </section>

      <section className="mt-8" aria-labelledby="plan">
        <h2 id="plan" className="visually-hidden">
          The plan
        </h2>
        <ProtocolHeadline days={protocol.days} outOfRange={outOfRange} />
        {categories.map((category) => (
          <ProtocolGroup
            key={category}
            category={category}
            items={protocol.items.filter((item) => item.category === category)}
            headroom={headroomByCategory[category]}
          />
        ))}
      </section>

      <Card className="mt-4">
        <Disclosure label="How changes to this plan work" glyph="info">
          <p className="t-prose text-ink-1">
            PreSeed proposes; you confirm. An adaptation is shown as a specific list of changes with the
            reason behind it, and accepting creates a new version while keeping the old one on record.
            Your plan is never rewritten quietly, because a plan that changes without you noticing is not
            a plan you can follow.
          </p>
        </Disclosure>
        <Disclosure label="Why supplements are information, not actions" glyph="attention">
          <p className="t-prose text-ink-1">
            The supplement effect sizes circulating in this space have not been traced to their source
            papers in this prototype, and the largest network meta-analysis reportedly showed no
            significant pregnancy-rate benefit. So supplements appear here as reading, labelled general
            guidance, with a clinician conversation attached — not as a dated action.
          </p>
        </Disclosure>
      </Card>

      <section className="mt-6" aria-labelledby="supplements">
        <SectionHeader
          id="supplements"
          eyebrow="Under research"
          title="Supplements"
          level={2}
        />
        <p className="mb-3 t-caption text-ink-3">{SUPPLEMENT_DISCLAIMER}</p>
        <div className="space-y-3">
          {supplementCandidates.map((candidate) => (
            <SupplementCandidateCard
              key={candidate.id}
              candidate={candidate}
              test={latestSemen}
            />
          ))}
        </div>
      </section>

      <DisclaimerFooter />
    </Screen>
  );
}
