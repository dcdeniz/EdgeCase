"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { ScoreMeter } from "@/components/charts";
import { FlowShell, SafetyAlert } from "@/components/shell";
import { Button, Card, MetaBadge, StatusChip } from "@/components/ui";
import { domainOrder, domains } from "@/lib/readiness";
import { trackLabel, usePrototype } from "@/lib/store";

export default function ReviewPage() {
  const router = useRouter();
  const { state, readiness, update } = usePrototype();

  const answeredDomains = readiness.domains.filter((domain) => domain.score != null).length;

  return (
    <FlowShell
      step={10}
      total={10}
      stepLabel="Review"
      back="/onboarding/exposure"
      title="Here is what PreSeed can say so far"
      intro="This is behaviour only. Nothing on this screen describes your sperm — that needs a laboratory result, which is the next step."
      footer={
        <Button
          full
          size="lg"
          glyphAfter="chevron-right"
          onClick={() => {
            update({ onboardingComplete: true });
            router.push(state.track === "vasectomy_reversal" ? "/reversal" : "/tests/new");
          }}
        >
          {state.track === "vasectomy_reversal" ? "Go to tracking" : "Add a clinical result"}
        </Button>
      }
    >
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

      <Card>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="t-micro text-ink-3">Readiness score</p>
            <p className="mt-1 t-title-2 text-ink-1">{readiness.band.label}</p>
          </div>
          <span className="flex items-baseline gap-1">
            <span className="t-display-1 text-ink-1">{readiness.score ?? "—"}</span>
            <span className="t-caption text-ink-3">/100</span>
          </span>
        </div>
        <div className="mt-3">
          <ScoreMeter value={readiness.score} label="Readiness score out of 100" />
        </div>
        <p className="mt-3 rounded-sm bg-surface-3 px-3 py-2.5 t-body-sm text-ink-2">
          This reflects modifiable behaviours, not measured sperm quality.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <MetaBadge glyph="pending">{readiness.ruleVersion}</MetaBadge>
          <MetaBadge glyph="target">
            {answeredDomains} of {domainOrder.length} domains answered
          </MetaBadge>
        </div>
      </Card>

      <Card className="mt-3">
        <p className="t-micro text-ink-3">Your answers</p>
        <dl className="mt-2 divide-y divide-hairline">
          <div className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="t-caption text-ink-3">Track</dt>
            <dd className="t-body-sm text-ink-1">{state.track ? trackLabel[state.track] : "—"}</dd>
          </div>
          {domainOrder.map((id) => {
            const result = readiness.domains.find((domain) => domain.id === id)!;
            return (
              <div key={id} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="t-caption text-ink-3">{domains[id].label}</dt>
                <dd className="t-mono text-ink-1">
                  {result.score == null ? <span className="text-ink-3">not answered</span> : `${result.score}/100`}
                </dd>
              </div>
            );
          })}
        </dl>
      </Card>

      {readiness.missingInputs.length > 0 ? (
        <Card tone="information" className="mt-3">
          <div className="flex gap-3">
            <Icon name="info" size={20} className="mt-0.5 shrink-0 text-information" />
            <div>
              <h2 className="t-title-3 text-ink-1">
                {readiness.missingInputs.length} answers left blank
              </h2>
              <p className="mt-1 t-body-sm text-ink-2">
                {readiness.missingInputs.join(", ")}. These lower your data confidence and leave your
                readiness score untouched. You can fill them in from Account whenever you like.
              </p>
              <p className="mt-2.5">
                <StatusChip tone="information" glyph="info">
                  Missing data never reduces readiness
                </StatusChip>
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="mt-3">
        <p className="t-micro text-ink-3">Next</p>
        <p className="mt-1.5 t-body-sm text-ink-2">
          A readiness score on its own is a behaviour report. The reasoning chains, the protocol and the
          trends all need a measured result — real or clearly simulated.
        </p>
      </Card>
    </FlowShell>
  );
}
