"use client";

import { DisclaimerFooter, Screen } from "@/components/shell";
import { ConfidenceCard } from "@/components/domain";
import { ButtonLink, Card, Disclosure, SectionHeader } from "@/components/ui";
import { usePrototype } from "@/lib/store";

export default function ConfidencePage() {
  const { confidence, latestSemen, hormonePanel } = usePrototype();

  const raisers = [
    ...(latestSemen?.source === "simulated"
      ? [
          {
            title: "Replace simulated data with a real result",
            body: "Simulated data caps confidence by design. A laboratory report is the single biggest improvement available.",
            href: "/tests/new",
            action: "Add a result",
          },
        ]
      : []),
    ...(!hormonePanel
      ? [
          {
            title: "Add a hormone panel",
            body: "Gives context for reading the semen result, and is required before the endocrine-pattern output can appear at all.",
            href: "/tests/new",
            action: "Add a panel",
          },
        ]
      : []),
    {
      title: "Answer the questions you skipped",
      body: "Each unanswered domain leaves weight uncovered in your readiness score, which is a confidence problem rather than a score problem.",
      href: "/onboarding/lifestyle",
      action: "Review answers",
    },
  ];

  return (
    <Screen title="Data confidence" eyebrow="How much to trust the rest" back="/results">
      <ConfidenceCard confidence={confidence} detailed />

      <section className="mt-6" aria-labelledby="raise">
        <SectionHeader id="raise" eyebrow="Next" title="What would raise this" />
        <div className="space-y-3">
          {raisers.map((raiser) => (
            <Card key={raiser.title}>
              <h3 className="t-title-3 text-ink-1">{raiser.title}</h3>
              <p className="mt-1 t-body-sm text-ink-2">{raiser.body}</p>
              <ButtonLink href={raiser.href} variant="secondary" full className="mt-3">
                {raiser.action}
              </ButtonLink>
            </Card>
          ))}
        </div>
      </section>

      <Card className="mt-6">
        <Disclosure label="Why this is a separate score" glyph="info" defaultOpen>
          <p className="t-prose text-ink-1">
            If missing data lowered your readiness score, then answering fewer questions would look like
            worse behaviour — and adding a hormone panel would look like an improvement in your health.
            Both are false. Keeping confidence separate means the readiness score only ever moves when
            your behaviour does.
          </p>
        </Disclosure>
        <Disclosure label="What a low confidence score does not mean" glyph="unavailable">
          <ul className="space-y-2 t-body-sm text-ink-2">
            <li>It does not mean your results are wrong.</li>
            <li>It does not mean your readiness score is wrong.</li>
            <li>It means there is less underneath both of them than there could be.</li>
          </ul>
        </Disclosure>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
