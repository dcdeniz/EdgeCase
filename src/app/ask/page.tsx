"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { DeltaBadge } from "@/components/score";
import { DisclaimerFooter, Screen } from "@/components/shell";
import { Button, Card, StatusChip, TextInput, cx } from "@/components/ui";
import { behaviourDomains, domainColour } from "@/lib/behaviour-score";
import { usePrototype } from "@/lib/store";
import {
  PROJECTION_CAVEAT,
  matchScenario,
  project,
  scenarios,
  type Projection,
} from "@/lib/what-if";

type Turn =
  | { kind: "question"; text: string }
  | { kind: "projection"; projection: Projection }
  | { kind: "unsupported"; text: string };

/**
 * Ask PreSeed.
 *
 * A question about the effect of a change is answered by re-running the score
 * with that input replaced, not by generating prose. The number shown is the
 * model's, so it cannot be invented — and when the model has nothing to say,
 * this says so instead of guessing.
 */
export default function AskPage() {
  const { state } = usePrototype();
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);

  function ask(text: string) {
    const scenario = matchScenario(text);
    setTurns((previous) => [
      ...previous,
      { kind: "question", text },
      scenario
        ? { kind: "projection", projection: project(state, scenario) }
        : { kind: "unsupported", text },
    ]);
    setDraft("");
  }

  return (
    <Screen title="Ask PreSeed" eyebrow="What-if">
      {turns.length === 0 ? (
        <Card>
          <p className="t-body-sm text-ink-2">
            Ask how a change would move your Seed Score. The answer comes from re-running the
            score with that input replaced.
          </p>
        </Card>
      ) : null}

      <div className="mt-4 space-y-3">
        {turns.map((turn, index) =>
          turn.kind === "question" ? (
            <p
              key={index}
              className="ml-auto max-w-[85%] rounded-lg rounded-br-xs bg-accent px-3.5 py-2.5 t-body-sm text-accent-ink"
            >
              {turn.text}
            </p>
          ) : turn.kind === "unsupported" ? (
            <Card key={index} tone="unavailable">
              <StatusChip tone="unavailable" glyph="unavailable">
                No projection available
              </StatusChip>
              <p className="mt-2.5 t-body-sm text-ink-2">
                The score model has nothing to say about that. It covers sleep, diet, activity and
                protocol adherence — a question outside those four has no number behind it, and
                PreSeed will not invent one.
              </p>
              <Link
                href="/coach"
                className="mt-2.5 inline-flex items-center gap-1 t-body-sm font-medium text-accent"
              >
                Ask the evidence library instead
                <Icon name="chevron-right" size={15} />
              </Link>
            </Card>
          ) : (
            <ProjectionCard key={index} projection={turn.projection} />
          ),
        )}
      </div>

      <div className="mt-5">
        <TextInput
          id="ask-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What if I slept eight hours a night?"
        />
        <Button full className="mt-2" disabled={draft.trim().length === 0} onClick={() => ask(draft)}>
          Ask
        </Button>
      </div>

      <section className="mt-6" aria-labelledby="suggestions">
        <p id="suggestions" className="t-micro text-ink-3">
          Questions the model can answer
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => ask(scenario.question)}
              className={cx(
                "min-h-11 rounded-full border border-line-control px-3.5 t-body-sm text-ink-1",
                "hover:bg-surface-3",
              )}
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </section>

      <DisclaimerFooter />
    </Screen>
  );
}

function ProjectionCard({ projection }: { projection: Projection }) {
  const { scenario, current, projected, delta, domainDeltas } = projection;

  return (
    <Card>
      <p className="t-micro text-ink-3">{scenario.question}</p>

      {delta != null && delta !== 0 ? (
        <>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="t-display-2 text-ink-3 ps-num">{current}</span>
            <Icon name="chevron-right" size={18} className="text-ink-3" />
            <span className="t-display-1 text-ink-1 ps-num">{projected}</span>
            <span className="ml-auto">
              <DeltaBadge delta={delta} />
            </span>
          </div>

          <ul className="mt-4 space-y-2 border-t border-hairline pt-3">
            {domainDeltas.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: domainColour[row.id] }}
                  />
                  <span className="truncate t-body-sm text-ink-2">
                    {behaviourDomains[row.id].label}
                  </span>
                </span>
                <span className="shrink-0 t-mono text-ink-1">
                  {row.from ?? "—"} → {row.to ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 t-body-sm text-ink-1">
          Your Seed Score would not change.
        </p>
      )}

      {scenario.note ? (
        <p className="mt-3 border-t border-hairline pt-3 t-body-sm text-ink-2">{scenario.note}</p>
      ) : null}

      <p className="mt-3 t-caption text-ink-3">{PROJECTION_CAVEAT}</p>
    </Card>
  );
}
