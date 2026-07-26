"use client";

import { DisclaimerFooter, Screen } from "@/components/shell";
import {
  Button,
  Card,
  ConfirmSheet,
  MetaList,
  RowLink,
  SectionHeader,
  StatusChip,
  announce,
} from "@/components/ui";
import { useState } from "react";
import { TODAY, formatDate } from "@/lib/format";
import { trackLabel, usePrototype } from "@/lib/store";

export default function AccountPage() {
  const { state, confidence, semenTests, reset, seedDemo } = usePrototype();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Screen title="Account">
      <Card>
        <p className="t-micro text-ink-3">Signed in as</p>
        <p className="mt-1 t-title-3 text-ink-1">{state.email ?? "Not signed in"}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {state.track ? <StatusChip tone="accent" glyph="target">{trackLabel[state.track]}</StatusChip> : null}
          {state.onboardingComplete ? (
            <StatusChip tone="supported">Onboarding complete</StatusChip>
          ) : (
            <StatusChip tone="attention">Onboarding incomplete</StatusChip>
          )}
        </div>
      </Card>

      <section className="mt-6" aria-labelledby="settings">
        <SectionHeader id="settings" eyebrow="Settings" title="Manage" />
        <Card inset>
          <RowLink
            href="/account/display"
            glyph="today"
            title="Display and accessibility"
            detail="Theme, text size, motion and contrast"
          />
          <RowLink
            href="/account/data"
            glyph="lock"
            title="Your data"
            detail="Provenance, export, consent and deletion"
          />
          <RowLink
            href="/account/wearables"
            glyph="steps"
            title="Wearables"
            detail="Connect Google Health and sync Fitbit data"
          />
          <RowLink
            href="/account/safety"
            glyph="shield"
            title="Safety centre"
            detail="What PreSeed is, its limits, and when to seek care"
          />
          <RowLink
            href="/onboarding/lifestyle"
            glyph="pencil"
            title="Update your answers"
            detail="Change anything you skipped or that has changed"
          />
        </Card>
      </section>

      <section className="mt-6" aria-labelledby="record">
        <SectionHeader id="record" eyebrow="On record" title="What PreSeed holds" level={3} />
        <Card>
          <MetaList
            items={[
              { label: "Clinical results", value: `${state.tests.length}` },
              { label: "Semen analyses", value: `${semenTests.length}` },
              { label: "Protocol versions", value: state.protocol ? `${state.protocol.version}` : "0" },
              { label: "Check-ins", value: `${state.checkIns.length}` },
              { label: "Adherence records", value: `${Object.keys(state.adherence).length}` },
              { label: "Data confidence", value: `${confidence.score}/100` },
              { label: "Today", value: formatDate(TODAY) },
            ]}
          />
        </Card>
      </section>

      {/* Worked-example loader. */}
      <section className="mt-6" aria-labelledby="demo">
        <SectionHeader id="demo" eyebrow="Workspace" title="Sample data" level={3} />
        <Card className="border-dashed">
          <p className="t-body-sm text-ink-2">
            Load a complete worked example — baseline analysis, protocol and follow-ups — to explore every screen with data in place.
          </p>
          <div className="mt-3 grid gap-2">
            <Button variant="secondary" glyph="simulated" onClick={() => { seedDemo("baseline"); announce("Baseline loaded"); }}>
              Load baseline analysis and protocol
            </Button>
            <Button variant="secondary" glyph="simulated" onClick={() => { seedDemo("retest"); announce("Closing analysis loaded"); }}>
              Load closing analysis
            </Button>
            <Button variant="secondary" glyph="simulated" onClick={() => { seedDemo("hormones"); announce("Hormone panel loaded"); }}>
              Load hormone panel
            </Button>
            <Button variant="secondary" glyph="simulated" onClick={() => { seedDemo("reversal"); announce("Reversal series loaded"); }}>
              Load reversal recovery series
            </Button>
            <Button variant="secondary" glyph="info" onClick={() => { seedDemo("adaptation"); announce("Proposed adaptation loaded"); }}>
              Propose a protocol adaptation
            </Button>
          </div>
          <Button variant="escalation" full className="mt-3" onClick={() => setConfirmReset(true)}>
            Reset workspace
          </Button>
        </Card>
      </section>

      <ConfirmSheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          reset();
          announce("Prototype reset", true);
        }}
        title="Reset workspace?"
        confirmLabel="Reset everything"
        tone="escalation"
        body="This clears every result, protocol version, adherence record and answer stored on this device. It cannot be undone."
      />

      <DisclaimerFooter />
    </Screen>
  );
}
