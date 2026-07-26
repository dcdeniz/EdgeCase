"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Icon } from "@/components/icons";
import { DisclaimerFooter, Screen } from "@/components/shell";
import {
  Button,
  Card,
  MetaBadge,
  PendingIntegration,
  SectionHeader,
  StatusChip,
} from "@/components/ui";
import { coachResponses, evidenceById, suggestedQuestions, type CoachResponse } from "@/lib/fixtures";
import { edgeApiUrl } from "@/lib/supabase-browser";

type RagAnswer = {
  answer: string;
  limitations: string[];
  clinicalEscalation: boolean;
  disclaimer: string;
  citations: Array<{
    id: string;
    title: string;
    citation: string;
    sourceUrl: string;
    evidenceLevel: string;
  }>;
};

/**
 * Contextual explanation, launched from a result, risk, domain, recommendation,
 * protocol item or evidence card. It explains existing account outputs and
 * retrieves approved evidence. It does not calculate anything.
 */
function CoachThread() {
  const params = useSearchParams();
  const contextId = params.get("context") ?? "";
  const contextLabel = params.get("label") ?? "your account";
  const [asked, setAsked] = useState<CoachResponse | null>(null);
  const [question, setQuestion] = useState("");
  const [ragAnswer, setRagAnswer] = useState<RagAnswer | null>(null);
  const [ragError, setRagError] = useState<string | null>(null);
  const [ragPending, setRagPending] = useState(false);

  const available = coachResponses.filter((response) => response.contextId === contextId);
  const hasPrepared = available.length > 0;

  async function askEvidence() {
    const url = edgeApiUrl("evidence/answer");
    if (!url) {
      setRagError("The evidence service is not configured in this environment.");
      return;
    }
    setRagPending(true);
    setRagError(null);
    setRagAnswer(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "The evidence service could not answer.");
      }
      setRagAnswer(payload.data as RagAnswer);
    } catch (caught) {
      setRagError(caught instanceof Error ? caught.message : "The evidence service could not answer.");
    } finally {
      setRagPending(false);
    }
  }

  return (
    <>
      {/* The context is pinned and always visible, never implied by history. */}
      <div className="sticky top-(--ps-header-height) z-10 -mx-4 mb-4 border-b border-hairline bg-ground/92 px-4 py-2.5 backdrop-blur-md">
        <p className="flex items-center gap-2 t-caption text-ink-2">
          <Icon name="target" size={15} className="shrink-0 text-accent" />
          <span className="min-w-0 truncate">
            Discussing: <span className="text-ink-1">{contextLabel}</span>
          </span>
        </p>
      </div>

      <Card tone="information">
        <div className="flex gap-3">
          <Icon name="coach" size={20} className="mt-0.5 shrink-0 text-information" />
          <div>
            <h2 className="t-title-3 text-ink-1">What this can and cannot do</h2>
            <p className="mt-1.5 t-body-sm text-ink-2">
              It explains outputs already in your account and retrieves approved evidence. It does not
              calculate scores, generate predictions, or interpret anything PreSeed has not verified.
              Every answer shows its citations and its limits.
            </p>
          </div>
        </div>
      </Card>

      <section className="mt-6" aria-labelledby="rag-question">
        <SectionHeader
          id="rag-question"
          eyebrow="Approved evidence"
          title="Ask about your results"
          level={2}
        />
        <label htmlFor="evidence-question" className="t-caption text-ink-2">
          Question
        </label>
        <textarea
          id="evidence-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={800}
          rows={4}
          placeholder="Why does my motility result change what the protocol emphasises?"
          className="mt-2 w-full rounded-sm border border-line-control bg-surface-1 px-3 py-2.5 t-body-sm text-ink-1 outline-none focus:border-accent"
        />
        <div className="mt-3">
          <Button
            full
            disabled={ragPending || question.trim().length === 0}
            onClick={askEvidence}
          >
            {ragPending ? "Retrieving evidence…" : "Ask PreSeed"}
          </Button>
        </div>
        {ragError ? <p role="alert" className="mt-3 t-body-sm text-danger">{ragError}</p> : null}
      </section>

      {ragAnswer ? (
        <Card className="mt-5" tone={ragAnswer.clinicalEscalation ? "attention" : undefined}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="supported" glyph="evidence">Retrieved + cited</StatusChip>
            {ragAnswer.clinicalEscalation ? (
              <StatusChip tone="attention" glyph="attention">Clinician recommended</StatusChip>
            ) : null}
          </div>
          <p className="mt-3 t-prose text-ink-1">{ragAnswer.answer}</p>
          <div className="mt-4 border-t border-hairline pt-3">
            <p className="t-micro text-ink-3">Sources used</p>
            <ul className="mt-2 space-y-2">
              {ragAnswer.citations.map((citation) => (
                <li key={citation.id}>
                  <a
                    href={citation.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-sm border border-hairline p-2.5 hover:bg-surface-3"
                  >
                    <span className="block t-body-sm text-ink-1">{citation.title}</span>
                    <span className="mt-1 block t-caption text-ink-3">{citation.citation}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 border-t border-hairline pt-3">
            <p className="t-micro text-ink-3">Limits</p>
            <ul className="mt-2 space-y-1.5">
              {ragAnswer.limitations.map((limitation) => (
                <li key={limitation} className="t-caption text-ink-2">{limitation}</li>
              ))}
            </ul>
            <p className="mt-3 t-caption text-ink-3">{ragAnswer.disclaimer}</p>
          </div>
        </Card>
      ) : null}

      {!hasPrepared ? (
        <div className="mt-4">
          <PendingIntegration
            title="No explanation available for this context"
            body="The explanation layer answers from approved evidence attached to your account outputs. Nothing is attached to this one, so PreSeed says nothing rather than improvising."
            dependency="coach contract, reserved for on-demand retrieval once account outputs exist"
            action={
              <Link href="/evidence" className="t-body-sm font-medium text-accent underline underline-offset-2">
                Browse the evidence library instead
              </Link>
            }
          />
        </div>
      ) : null}

      {hasPrepared && !asked ? (
        <section className="mt-6" aria-labelledby="questions">
          <SectionHeader id="questions" eyebrow="Ask" title="Common questions here" level={3} />
          <div className="space-y-2">
            {available.map((response) => (
              <button
                key={response.question}
                type="button"
                onClick={() => setAsked(response)}
                className="flex min-h-(--ps-touch-min) w-full items-center gap-3 rounded-sm border border-line-control bg-surface-1 px-3 py-2.5 text-left hover:bg-surface-3"
              >
                <span className="flex-1 t-body-sm text-ink-1">{response.question}</span>
                <Icon name="chevron-right" size={17} className="shrink-0 text-ink-3" />
              </button>
            ))}
          </div>

          <p className="mt-4 t-micro text-ink-3">Also asked</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedQuestions.map((question) => (
              <span
                key={question}
                className="rounded-xs border border-dashed border-hairline px-2.5 py-1.5 t-caption text-ink-3"
              >
                {question}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {asked ? (
        <section className="mt-6" aria-labelledby="answer">
          <div className="mb-3 flex justify-end">
            <p className="max-w-[85%] rounded-lg rounded-br-xs bg-accent px-3.5 py-2.5 t-body-sm text-accent-ink">
              {asked.question}
            </p>
          </div>

          <div className="rounded-lg rounded-bl-xs border border-hairline bg-surface-1 p-4">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <span className="t-micro text-ink-3">PreSeed</span>
              {asked.state === "answered" ? (
                <StatusChip tone="supported" glyph="evidence">
                  Cited
                </StatusChip>
              ) : asked.state === "evidence_insufficient" ? (
                <StatusChip tone="attention" glyph="attention">
                  Evidence insufficient
                </StatusChip>
              ) : (
                <StatusChip tone="unavailable" glyph="unavailable">
                  Explanation unavailable
                </StatusChip>
              )}
            </div>

            <h2 id="answer" className="visually-hidden">
              Answer
            </h2>
            <p className="t-prose text-ink-1">{asked.answer}</p>

            {asked.evidenceIds.length > 0 ? (
              <div className="mt-4 border-t border-hairline pt-3">
                <p className="t-micro text-ink-3">Citations</p>
                <ul className="mt-2 space-y-2">
                  {asked.evidenceIds.map((id) => {
                    const claim = evidenceById.get(id);
                    if (!claim) return null;
                    return (
                      <li key={id}>
                        <Link
                          href={`/evidence/${id}`}
                          className="flex items-start gap-2 rounded-sm border border-hairline p-2.5 hover:bg-surface-3"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block t-body-sm text-ink-1">{claim.source}</span>
                            <span className="mt-1 flex flex-wrap gap-1.5">
                              <MetaBadge glyph={claim.causal ? "check-circle" : "results"}>
                                {claim.causal ? "Interventional" : "Observational"}
                              </MetaBadge>
                            </span>
                          </span>
                          <Icon name="chevron-right" size={16} className="mt-0.5 shrink-0 text-ink-3" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="mt-4 border-t border-hairline pt-3 t-caption text-ink-3">
                No citations, because no approved evidence supports an answer here.
              </p>
            )}

            <div className="mt-3 border-t border-hairline pt-3">
              <p className="t-micro text-ink-3">Limitations</p>
              <ul className="mt-1.5 space-y-1.5">
                {asked.limitations.map((limitation) => (
                  <li key={limitation} className="flex gap-2 t-caption text-ink-2">
                    <Icon name="info" size={14} className="mt-0.5 shrink-0 text-ink-3" />
                    {limitation}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="secondary" full onClick={() => setAsked(null)}>
              Ask something else
            </Button>
          </div>
        </section>
      ) : null}

      <Card className="mt-6">
        <p className="t-micro text-ink-3">How this works</p>
        <p className="mt-1.5 t-body-sm text-ink-2">
          The form above uses live vector
          retrieval over the approved evidence set, validates output against a closed schema, and rejects
          citations that were not retrieved. It cannot change a score, diagnose a condition, recommend
          hormone treatment, or apply a protocol change.
        </p>
      </Card>

      <DisclaimerFooter />
    </>
  );
}

export default function CoachPage() {
  return (
    <Screen title="Ask PreSeed" eyebrow="Contextual explanation" back={true}>
      <Suspense fallback={<Card>Loading context…</Card>}>
        <CoachThread />
      </Suspense>
    </Screen>
  );
}
