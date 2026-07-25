"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { FlowShell, SafetyAlert } from "@/components/shell";
import { Button, Card, ChoiceGroup, Disclosure, Field, TextArea } from "@/components/ui";
import { clinicalGates } from "@/lib/readiness";
import { usePrototype } from "@/lib/store";

function toggle(list: string[] | undefined, value: string) {
  const current = list ?? [];
  if (value === "none" || value === "prefer_not") return [value];
  const next = current.filter((entry) => entry !== "none" && entry !== "prefer_not");
  return next.includes(value) ? next.filter((entry) => entry !== value) : [...next, value];
}

export default function HealthPage() {
  const router = useRouter();
  const { state, setAnswers } = usePrototype();
  const answers = state.answers;
  const gates = clinicalGates(answers);
  const isReversal = state.track === "vasectomy_reversal";

  return (
    <FlowShell
      step={8}
      total={10}
      stepLabel="Clinical history"
      back={isReversal ? "/start/track" : "/onboarding/lifestyle"}
      title="History that changes how results are read"
      intro="Some of this is sensitive. Every question here either changes your plan or routes you to a clinician — nothing is collected out of curiosity."
      footer={
        <Button full size="lg" glyphAfter="chevron-right" onClick={() => router.push("/onboarding/exposure")}>
          Continue
        </Button>
      }
    >
      <ChoiceGroup
        legend="Diagnosed conditions — select any that apply"
        hint="These belong in clinical interpretation, not in your behavioural score. None of them will reduce your readiness."
        name="conditions"
        multiple
        value={answers.conditions}
        onChange={(value) => setAnswers({ conditions: toggle(answers.conditions, value) })}
        options={[
          { value: "varicocele", label: "Varicocele" },
          { value: "undescended_testes", label: "Undescended testes as a child" },
          { value: "testicular_injury", label: "Testicular injury, torsion or surgery" },
          { value: "cancer_treatment", label: "Cancer treatment, past or planned" },
          { value: "diabetes", label: "Diabetes" },
          { value: "infection", label: "Genital-tract infection" },
          { value: "none", label: "None of these" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <ChoiceGroup
        legend="Medicines and substances — select any that apply"
        hint="PreSeed will never tell you to stop or change a prescribed medicine. This exists so it can flag a conversation worth having and avoid recommending something unsafe."
        name="medications"
        multiple
        value={answers.medications}
        onChange={(value) => setAnswers({ medications: toggle(answers.medications, value) })}
        options={[
          {
            value: "testosterone",
            label: "Testosterone or anabolic steroids",
            note: "Including prescribed testosterone and anything from a gym or online source.",
          },
          { value: "sulfasalazine", label: "Sulfasalazine" },
          { value: "opioids", label: "Long-term opioids" },
          { value: "finasteride", label: "Finasteride or dutasteride" },
          { value: "ssri", label: "An SSRI or other antidepressant" },
          { value: "none", label: "None of these" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      {gates.length > 0 ? (
        <div className="mb-5 space-y-3">
          {gates.map((gate) => (
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

      <ChoiceGroup
        legend="Sexual and reproductive health — select any that apply"
        hint="These affect the real-world chance of conception and can point at causes worth investigating. They do not measure semen quality, and you can skip this entirely."
        name="sexualHealth"
        multiple
        value={answers.sexualHealth}
        onChange={(value) => setAnswers({ sexualHealth: toggle(answers.sexualHealth, value) })}
        options={[
          { value: "low_libido", label: "Lower interest in sex than usual" },
          { value: "erectile", label: "Difficulty getting or keeping an erection" },
          { value: "ejaculation", label: "Difficulty ejaculating" },
          { value: "infrequent", label: "Ejaculating less than once a week" },
          { value: "none", label: "None of these" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <Field
        label="Anything else a clinician should know"
        htmlFor="history-notes"
        optional
        hint="Free text. Kept on your record and shown back to you before appointments."
      >
        <TextArea id="history-notes" hint placeholder="Previous fertility tests, family history, anything relevant." />
      </Field>

      <Card>
        <Disclosure label="Why asking about steroids matters" glyph="info">
          <p className="t-body-sm text-ink-2">
            Exogenous testosterone is one of the few things in this questionnaire that can stop sperm
            production outright, and recovery after stopping is measured in months. A good diet and good
            sleep cannot offset it. If PreSeed did not ask, it could hand someone a lifestyle plan while
            the actual cause sat untouched — so it asks, routes to a clinician, and never suggests a
            change to the medicine itself.
          </p>
        </Disclosure>
        <Disclosure label="What 'prefer not to say' does" glyph="lock">
          <p className="t-body-sm text-ink-2">
            It records that the question was asked and declined. The domain then has no score, which
            lowers your data confidence and leaves your readiness untouched. It is a real answer, not a
            gap.
          </p>
        </Disclosure>
      </Card>

      <p className="mt-4 flex items-start gap-2 t-caption text-ink-3">
        <Icon name="lock" size={15} className="mt-0.5 shrink-0" />
        Stored against your account only. Not shared with any clinic, insurer or employer.
      </p>
    </FlowShell>
  );
}
