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
import { categoryLabel, protocolTemplate, type ProtocolCategory } from "@/lib/fixtures";
import { formatDate } from "@/lib/format";
import { itemsForWeek, protocolWeek, usePrototype } from "@/lib/store";

const categories = Object.keys(categoryLabel) as ProtocolCategory[];

export default function ProtocolPage() {
  const { state, seedDemo } = usePrototype();
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

      <Card className="mt-4">
        <p className="t-micro text-ink-3">Categories in your plan</p>
        <ul className="mt-2 space-y-2">
          {categories.map((category) => {
            const count = protocolTemplate.filter((item) => item.category === category).length;
            return (
              <li key={category} className="flex items-baseline justify-between gap-3">
                <span className="t-body-sm text-ink-2">{categoryLabel[category]}</span>
                <span className="t-mono text-ink-1">{count}</span>
              </li>
            );
          })}
        </ul>
      </Card>

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

      <DisclaimerFooter />
    </Screen>
  );
}
