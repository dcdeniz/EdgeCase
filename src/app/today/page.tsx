"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { DisclaimerFooter, SafetyAlert, Screen } from "@/components/shell";
import {
  AdaptationProposal,
  ConsistencyCard,
  ProtocolAction,
  ProtocolProgress,
  RetestPrompt,
} from "@/components/protocol";
import { ReadinessSummary } from "@/components/domain";
import { Button, ButtonLink, Card, EmptyState, SectionHeader, SimulatedBadge } from "@/components/ui";
import { TODAY, daysBetween, formatDate } from "@/lib/format";
import { itemsForWeek, protocolDay, protocolWeek, usePrototype } from "@/lib/store";

/**
 * Today answers one question: what do I do now. Everything competing with that
 * answer is either removed or pushed below it.
 */
export default function TodayPage() {
  const { state, readiness, latestSemen, seedDemo } = usePrototype();
  const protocol = state.protocol;

  return (
    <Screen title="Today" eyebrow={formatDate(TODAY)}>
      {/* Serious flags sit above everything, including a good score. */}
      {readiness.gates.length > 0 ? (
        <div className="mb-4 space-y-3">
          {readiness.gates.map((gate) => (
            <SafetyAlert
              key={gate.id}
              severity={gate.severity}
              title={gate.title}
              body={
                <>
                  <p>{gate.body}</p>
                  <p className="mt-2 font-medium text-ink-1">{gate.action}</p>
                </>
              }
              nonModifiable={gate.nonModifiable}
            />
          ))}
        </div>
      ) : null}

      {state.adaptation ? (
        <div className="mb-4">
          <AdaptationProposal />
        </div>
      ) : null}

      {!protocol ? (
        <EmptyState
          glyph="protocol"
          title="No protocol yet"
          body="A dated protocol is built from a measured result, so the plan responds to something real rather than to a questionnaire alone."
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
      ) : (
        <>
          <ProtocolProgress protocol={protocol} />

          {daysBetween(protocol.retestDueOn, TODAY) > -14 ? (
            <div className="mt-4">
              <RetestPrompt protocol={protocol} />
            </div>
          ) : null}

          <section className="mt-6" aria-labelledby="today-actions">
            <SectionHeader
              id="today-actions"
              eyebrow={`Day ${protocolDay(protocol)} · week ${protocolWeek(protocol)}`}
              title="Today's actions"
              action={
                <Link href="/protocol" className="t-caption font-medium text-accent">
                  Full plan
                </Link>
              }
            />
            <div className="space-y-3">
              {itemsForWeek(protocol, protocolWeek(protocol))
                .filter((item) => item.cadence === "daily")
                .map((item) => (
                  <ProtocolAction key={item.id} item={item} />
                ))}
            </div>
          </section>

          <section className="mt-6" aria-labelledby="today-week">
            <SectionHeader id="today-week" eyebrow="This week" title="Weekly actions" level={3} />
            <div className="space-y-3">
              {itemsForWeek(protocol, protocolWeek(protocol))
                .filter((item) => item.cadence !== "daily")
                .map((item) => (
                  <ProtocolAction key={item.id} item={item} showLink={false} />
                ))}
            </div>
          </section>

          <div className="mt-6">
            <ConsistencyCard />
          </div>

          <div className="mt-4">
            <Card>
              <SectionHeader eyebrow="Check-in" title="How is this going?" level={3} />
              <p className="t-body-sm text-ink-2">
                Two minutes. Your answers decide what PreSeed proposes changing — and it will always
                propose rather than change it for you.
              </p>
              <ButtonLink href="/protocol/check-in" variant="secondary" full className="mt-3" glyph="pencil">
                Start check-in
              </ButtonLink>
            </Card>
          </div>
        </>
      )}

      <section className="mt-6" aria-labelledby="today-readiness">
        <SectionHeader id="today-readiness" eyebrow="Behaviour" title="Readiness" level={3} />
        <ReadinessSummary readiness={readiness} />
      </section>

      {latestSemen ? (
        <div className="mt-4">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="t-micro text-ink-3">Latest clinical result</p>
                <p className="mt-1 t-body-sm text-ink-1">{formatDate(latestSemen.collectedAt)}</p>
              </div>
              {latestSemen.source === "simulated" ? <SimulatedBadge compact /> : null}
            </div>
            <Link
              href="/results"
              className="mt-3 flex min-h-(--ps-touch-min) items-center justify-between rounded-sm bg-surface-3 px-3 t-body-sm font-medium text-ink-1"
            >
              Open results
              <Icon name="chevron-right" size={18} className="text-ink-3" />
            </Link>
          </Card>
        </div>
      ) : null}

      <DisclaimerFooter />
    </Screen>
  );
}
