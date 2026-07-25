"use client";

import { useState } from "react";
import { DisclaimerFooter, Screen } from "@/components/shell";
import { ConfidenceCard } from "@/components/domain";
import {
  Button,
  Card,
  ConfirmSheet,
  Disclosure,
  MetaBadge,
  PendingIntegration,
  SectionHeader,
  SimulatedBadge,
  StatusChip,
  announce,
} from "@/components/ui";
import { sourceLabel, verificationLabel } from "@/lib/clinical";
import { formatDate } from "@/lib/format";
import { usePrototype } from "@/lib/store";

export default function DataPage() {
  const { state, confidence, update } = usePrototype();
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  return (
    <Screen title="Your data" eyebrow="Provenance and control" back="/account">
      <ConfidenceCard confidence={confidence} />

      <section className="mt-6" aria-labelledby="records">
        <SectionHeader id="records" eyebrow="Every record" title="Clinical results on file" />
        {state.tests.length === 0 ? (
          <Card>
            <p className="t-body-sm text-ink-2">No clinical results stored.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {[...state.tests]
              .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))
              .map((test) => (
                <Card key={test.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="t-body-sm font-medium text-ink-1">
                        {test.testType === "semen_analysis" ? "Semen analysis" : "Hormone panel"}
                      </p>
                      <p className="mt-0.5 t-caption text-ink-3">{formatDate(test.collectedAt)}</p>
                    </div>
                    {test.source === "simulated" ? <SimulatedBadge compact /> : null}
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <MetaBadge glyph={test.source === "simulated" ? "simulated" : test.source === "upload" ? "upload" : "hand"}>
                      {sourceLabel[test.source]}
                    </MetaBadge>
                    <MetaBadge glyph="target">{test.markers.length} markers</MetaBadge>
                    {test.labName ? <MetaBadge glyph="lab">{test.labName}</MetaBadge> : null}
                  </div>

                  <ul className="mt-3 divide-y divide-hairline border-t border-hairline">
                    {test.markers.map((marker) => (
                      <li key={marker.code} className="flex items-baseline justify-between gap-3 py-2">
                        <span className="t-mono text-ink-3">{marker.code}</span>
                        <span className="flex items-baseline gap-2">
                          <span className="t-mono text-ink-1">
                            {marker.value} {marker.unit}
                          </span>
                          <span className="t-caption text-ink-3">
                            {verificationLabel[marker.verification]}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
          </div>
        )}
      </section>

      <section className="mt-6" aria-labelledby="control">
        <SectionHeader id="control" eyebrow="Control" title="Export, consent and deletion" />
        <div className="space-y-3">
          <PendingIntegration
            title="Export everything"
            body="A single file containing every result, protocol version, adherence record and check-in, with provenance intact — suitable for taking to an appointment. It needs an export operation, which is not implemented."
            dependency="an export operation, absent from the current contract"
          />

          <Card>
            <h3 className="t-title-3 text-ink-1">Health-data consent</h3>
            <p className="mt-1 t-body-sm text-ink-2">
              {state.consents.healthData
                ? "Given. Withdrawing stops processing and offers you an export and deletion."
                : "Not given. PreSeed cannot process health data without it."}
            </p>
            <p className="mt-2.5">
              <StatusChip tone={state.consents.healthData ? "supported" : "attention"}>
                {state.consents.healthData ? "Consent given" : "Consent not given"}
              </StatusChip>
            </p>
            {state.consents.healthData ? (
              <Button variant="secondary" full className="mt-3" onClick={() => setConfirmWithdraw(true)}>
                Withdraw consent
              </Button>
            ) : null}
          </Card>
        </div>
      </section>

      <Card className="mt-6">
        <Disclosure label="Why every value carries a provenance" glyph="lock" defaultOpen>
          <p className="t-prose text-ink-1">
            A number typed from memory, a number read off a laboratory report, and a number from a
            demonstration fixture are not the same evidence, even when they are the same digits. Storing
            provenance and verification on every value is what lets PreSeed calculate confidence honestly
            rather than treating all inputs as equal.
          </p>
        </Disclosure>
        <Disclosure label="Why records are append-only" glyph="info">
          <p className="t-prose text-ink-1">
            Clinical observations, score snapshots, protocol versions and adherence records are added, not
            edited. Correcting a value creates a new record. That way the history you or a clinician looks
            back on is what was actually known at the time.
          </p>
        </Disclosure>
      </Card>

      <ConfirmSheet
        open={confirmWithdraw}
        onClose={() => setConfirmWithdraw(false)}
        onConfirm={() => {
          update({ consents: { ...state.consents, healthData: false } });
          announce("Health-data consent withdrawn", true);
        }}
        title="Withdraw health-data consent?"
        confirmLabel="Withdraw consent"
        tone="escalation"
        body="PreSeed will stop processing your health data. Your scores and protocol will no longer be calculated. You can export your records first, and you can give consent again at any time."
      />

      <DisclaimerFooter />
    </Screen>
  );
}
