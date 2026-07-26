"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { DeltaBadge } from "@/components/score";
import { DisclaimerFooter, Screen } from "@/components/shell";
import {
  Button,
  Card,
  MetaBadge,
  StatusChip,
  TextInput,
} from "@/components/ui";
import { behaviourDomains, domainColour } from "@/lib/behaviour-score";
import { confidenceLabel, reviewStatusLabel } from "@/lib/fixtures";
import { usePrototype } from "@/lib/store";
import { answerQuestion, sampleQuestions, type Answer } from "@/lib/ask";
import { NO_CONCEPTION_CLAIM } from "@/lib/supplements";
import { PROJECTION_CAVEAT, type Projection } from "@/lib/what-if";

type Turn =
  | { kind: "question"; text: string }
  | { kind: "thinking" }
  | { kind: "answer"; answer: Answer };

/**
 * Ask PreSeed.
 *
 * Answers are assembled from evidence cards and the score model, never
 * generated. See `src/lib/ask.ts` for why that boundary is the safety property
 * rather than a limitation.
 */
export default function AskPage() {
  const { state } = usePrototype();
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  function ask(text: string) {
    if (busy) return;
    setBusy(true);
    setDraft("");
    setTurns((previous) => [...previous, { kind: "question", text }, { kind: "thinking" }]);

    // A beat before the answer. Retrieval is instant; a result that appears
    // with no delay reads as canned rather than considered.
    window.setTimeout(() => {
      const answer = answerQuestion(state, text);
      setTurns((previous) => [...previous.slice(0, -1), { kind: "answer", answer }]);
      setBusy(false);
    }, 700);
  }

  return (
    <Screen title="Ask PreSeed" eyebrow="Evidence and what-if">
      {turns.length === 0 ? (
        <Card>
          <p className="t-body-sm text-ink-2">
            Ask about anything in the evidence library, or how a change would move your Seed
            Score. Answers come from reviewed cards and from re-running the score — never from a
            model writing prose.
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
          ) : turn.kind === "thinking" ? (
            <Card key={index}>
              <p className="flex items-center gap-2 t-body-sm text-ink-3">
                <Icon name="coach" size={16} className="animate-pulse" />
                Searching the evidence library…
              </p>
            </Card>
          ) : (
            <AnswerCard key={index} answer={turn.answer} />
          ),
        )}
      </div>

      <div className="mt-5">
        <TextInput
          id="ask-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && draft.trim().length > 0) ask(draft);
          }}
          placeholder="Is CoQ10 beneficial for fertility?"
        />
        <Button
          full
          className="mt-2"
          disabled={busy || draft.trim().length === 0}
          onClick={() => ask(draft)}
        >
          {busy ? "Thinking…" : "Ask"}
        </Button>
      </div>

      <section className="mt-6" aria-labelledby="suggestions">
        <p id="suggestions" className="t-micro text-ink-3">
          Try
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sampleQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => ask(question)}
              className="min-h-11 rounded-full border border-line-control px-3.5 text-left t-body-sm text-ink-1 hover:bg-surface-3"
            >
              {question}
            </button>
          ))}
        </div>
      </section>

      <DisclaimerFooter />
    </Screen>
  );
}

/* ========================================================================== */

function AnswerCard({ answer }: { answer: Answer }) {
  if (answer.kind === "projection") return <ProjectionCard projection={answer.projection} />;

  if (answer.kind === "unsupported") {
    return (
      <Card>
        <StatusChip tone="unavailable" glyph="unavailable">
          Nothing in the library
        </StatusChip>
        <p className="mt-2.5 t-body-sm text-ink-2">
          No reviewed evidence card covers that, and the score model has no projection for it.
          PreSeed will not answer from outside its own library, because an answer with no card
          behind it is a guess wearing a lab coat.
        </p>
        <Link
          href="/evidence"
          className="mt-2.5 inline-flex items-center gap-1 t-body-sm font-medium text-accent"
        >
          Browse the library
          <Icon name="chevron-right" size={15} />
        </Link>
      </Card>
    );
  }

  const { subject, claims, supplement, product, impact } = answer;

  return (
    <Card>
      <p className="t-micro text-ink-3">{subject}</p>

      {/* What the evidence actually says, verbatim from the card. */}
      {claims.map((claim) => (
        <div key={claim.id} className="mt-3 first:mt-2">
          <p className="t-prose text-ink-1">{claim.claim}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <MetaBadge glyph={claim.causal ? "check-circle" : "results"}>
              {claim.causal ? "Interventional" : "Observational"}
            </MetaBadge>
            <MetaBadge glyph="info">{confidenceLabel[claim.confidence]}</MetaBadge>
            <MetaBadge glyph={claim.reviewStatus === "internal_review" ? "check" : "pending"}>
              {reviewStatusLabel[claim.reviewStatus]}
            </MetaBadge>
          </div>

          <div className="mt-3 border-t border-hairline pt-2.5">
            <p className="t-micro text-ink-3">Limits</p>
            <ul className="mt-1.5 space-y-1.5">
              {claim.limitations.map((line) => (
                <li key={line} className="flex gap-2 t-caption text-ink-2">
                  <Icon name="info" size={13} className="mt-0.5 shrink-0 text-ink-3" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={`/evidence/${claim.id}`}
            className="mt-2.5 inline-flex items-center gap-1 t-body-sm font-medium text-accent"
          >
            {claim.source}
            <Icon name="chevron-right" size={14} />
          </Link>
        </div>
      ))}

      {/* Where a named compound exists, its own blocker is the honest answer. */}
      {supplement ? (
        <div className="mt-4 rounded-sm border border-dashed border-hairline p-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="t-title-3 text-ink-1">{supplement.name}</p>
            <StatusChip tone="unavailable" glyph="pending">
              Not recommended
            </StatusChip>
          </div>
          <p className="mt-2 t-body-sm text-ink-2">{supplement.rationale}</p>
          <p className="mt-2 t-caption text-ink-3">
            Studies used {supplement.studiedDose.toLowerCase()}.
          </p>
          <p className="mt-2 flex gap-2 t-caption text-ink-2">
            <Icon name="attention" size={13} className="mt-0.5 shrink-0 text-attention" />
            {supplement.blocker}
          </p>
          <p className="mt-2 t-caption text-ink-3">{NO_CONCEPTION_CLAIM}</p>
        </div>
      ) : null}

      {product ? (
        <div className="mt-3 rounded-sm border border-dashed border-hairline p-3">
          <p className="t-micro text-ink-3">{product.brand}</p>
          <p className="mt-0.5 t-title-3 text-ink-1">{product.name}</p>
          <p className="mt-1.5 t-body-sm text-ink-2">{product.what}</p>
          <p className="mt-2 flex gap-2 t-caption text-ink-2">
            <Icon name="attention" size={13} className="mt-0.5 shrink-0 text-attention" />
            {product.evidenceLevel}
          </p>
        </div>
      ) : null}

      {/* The bit only this product can answer. */}
      <div className="mt-4 border-t border-hairline pt-3">
        <p className="t-micro text-ink-3">Effect on your Seed Score</p>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="t-title-1 text-ink-1 ps-num">
            {impact.domain == null ? "None" : `up to +${impact.available}`}
          </span>
          {impact.domain ? (
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full"
              style={{ background: domainColour[impact.domain] }}
            />
          ) : null}
          {impact.domain ? (
            <span className="t-caption text-ink-3">
              via {behaviourDomains[impact.domain].label.toLowerCase()}
            </span>
          ) : null}
        </p>
        <p className="mt-1.5 t-body-sm text-ink-2">{impact.explanation}</p>
      </div>
    </Card>
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
        <p className="mt-2 t-body-sm text-ink-1">Your Seed Score would not change.</p>
      )}

      {scenario.note ? (
        <p className="mt-3 border-t border-hairline pt-3 t-body-sm text-ink-2">{scenario.note}</p>
      ) : null}

      <p className="mt-3 t-caption text-ink-3">{PROJECTION_CAVEAT}</p>
    </Card>
  );
}
