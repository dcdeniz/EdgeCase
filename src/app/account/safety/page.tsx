"use client";

import { Icon } from "@/components/icons";
import { DisclaimerFooter, PROTOTYPE_DISCLAIMER, SafetyAlert, Screen } from "@/components/shell";
import { Card, Disclosure, SectionHeader } from "@/components/ui";

const seekCare = [
  "A lump, swelling, or pain in a testicle.",
  "A zero or extremely low result on any test.",
  "Pain, discharge or symptoms suggesting infection.",
  "Reduced libido, erectile difficulty or other changes in sexual function.",
  "Any hormone result outside your laboratory's interval.",
  "Cancer treatment planned, in progress or recently finished.",
  "Twelve months of trying to conceive without success, or six months if your partner is over 35.",
];

const neverDoes = [
  { title: "Diagnose", body: "No output in PreSeed is a diagnosis. Screening risks name an endpoint and a band; they are not findings." },
  { title: "Confirm azoospermia", body: "Confirmation requires examining the sediment of a centrifuged sample. No consumer method can do this." },
  { title: "Diagnose endocrine disease", body: "Hormone results are context for reading a semen result. Anything unexpected routes to a clinician." },
  { title: "Recommend hormone treatment", body: "Not FSH, hCG, clomiphene, aromatase inhibitors, and never testosterone — which suppresses sperm production." },
  { title: "Tell you to stop a medicine", body: "PreSeed creates a question for your clinician. It never advises changing prescribed treatment." },
  { title: "Predict conception", body: "The evidence behind this product concerns semen measurements, not pregnancy or live birth." },
  { title: "Replace a laboratory", body: "PreSeed records and interprets what a laboratory measured. It measures nothing itself." },
];

export default function SafetyPage() {
  return (
    <Screen title="Safety centre" eyebrow="Limits and escalation" back="/account">
      <Card tone="attention">
        <p className="t-prose text-ink-1">{PROTOTYPE_DISCLAIMER}</p>
      </Card>

      <section className="mt-6" aria-labelledby="seek">
        <SectionHeader id="seek" eyebrow="Escalation" title="See a clinician if any of these apply" />
        <SafetyAlert
          severity="escalation"
          title="These are reasons to seek care, not to keep tracking"
          body={
            <ul className="mt-1 space-y-2">
              {seekCare.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-escalation" />
                  {line}
                </li>
              ))}
            </ul>
          }
        />
      </section>

      <section className="mt-6" aria-labelledby="never">
        <SectionHeader id="never" eyebrow="Hard limits" title="What PreSeed never does" />
        <div className="space-y-2.5">
          {neverDoes.map((entry) => (
            <Card key={entry.title}>
              <div className="flex gap-3">
                <Icon name="unavailable" size={19} className="mt-0.5 shrink-0 text-ink-3" />
                <div>
                  <h3 className="t-title-3 text-ink-1">{entry.title}</h3>
                  <p className="mt-1 t-body-sm text-ink-2">{entry.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="design">
        <SectionHeader id="design" eyebrow="By design" title="How the interface protects you" />
        <Card>
          <Disclosure label="A serious flag cannot be hidden by a good score" glyph="shield" defaultOpen>
            <p className="t-prose text-ink-1">
              Clinical gates render above every score, on Today and on the readiness screen, and they
              cannot be dismissed. A composite average is structurally incapable of cancelling one,
              because gates are not points.
            </p>
          </Disclosure>
          <Disclosure label="Missing data lowers confidence, not readiness" glyph="info">
            <p className="t-prose text-ink-1">
              If skipping a question lowered your readiness score, answering less would look like behaving
              worse. Data quality is reported separately, so the readiness score only moves when your
              behaviour does.
            </p>
          </Disclosure>
          <Disclosure label="Conditions you did not choose cost you nothing" glyph="account">
            <p className="t-prose text-ink-1">
              Age, developmental history, genetic findings and diagnosed conditions belong in clinical
              interpretation. They are never expressed as behavioural deductions.
            </p>
          </Disclosure>
          <Disclosure label="Simulated data is labelled everywhere" glyph="simulated">
            <p className="t-prose text-ink-1">
              Every list, card, chart and comparison built on demonstration data carries a simulated
              badge, and simulated provenance caps your data confidence.
            </p>
          </Disclosure>
          <Disclosure label="Your plan is never rewritten silently" glyph="protocol">
            <p className="t-prose text-ink-1">
              Adaptations are proposed as a specific list of changes with the reason attached. Accepting
              creates a new version and keeps the previous one on record.
            </p>
          </Disclosure>
        </Card>
      </section>

      <Card className="mt-6">
        <p className="t-micro text-ink-3">If you are in crisis</p>
        <p className="mt-1.5 t-body-sm text-ink-2">
          Fertility difficulty is genuinely distressing, and this app is not equipped to help with that.
          Contact your doctor or a local crisis service if you need support now.
        </p>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
