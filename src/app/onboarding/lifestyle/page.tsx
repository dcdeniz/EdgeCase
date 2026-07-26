"use client";

import { useRouter } from "next/navigation";
import { FlowShell } from "@/components/shell";
import { Button, Card, ChoiceGroup, Disclosure } from "@/components/ui";
import { usePrototype } from "@/lib/store";

function toggle(list: string[] | undefined, value: string) {
  const current = list ?? [];
  // "None" and "prefer not to say" are exclusive — they cannot coexist with items.
  if (value === "none" || value === "prefer_not") return [value];
  const next = current.filter((entry) => entry !== "none" && entry !== "prefer_not");
  return next.includes(value) ? next.filter((entry) => entry !== value) : [...next, value];
}

export default function LifestylePage() {
  const router = useRouter();
  const { state, setAnswers } = usePrototype();
  const answers = state.answers;

  return (
    <FlowShell
      step={7}
      total={10}
      stepLabel="Lifestyle"
      back="/onboarding/goal"
      title="The behaviours with real evidence behind them"
      intro="Only questions that change your plan. Anything you skip lowers your data confidence — never your readiness score."
      footer={
        <Button full size="lg" glyphAfter="chevron-right" onClick={() => router.push("/onboarding/health")}>
          Continue
        </Button>
      }
    >
      <ChoiceGroup
        legend="Typical sleep on a work night"
        hint="Sleep carries the largest single weight in your readiness score, because it has the most consistent human evidence of the modifiable factors."
        name="sleepHours"
        value={answers.sleepHours}
        onChange={(value) => setAnswers({ sleepHours: value })}
        columns={2}
        options={[
          { value: "under6", label: "Under 6 hours" },
          { value: "6to7", label: "6 to 7 hours" },
          { value: "7to8", label: "7 to 8 hours" },
          { value: "over8", label: "Over 8 hours" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <ChoiceGroup
        legend="How regular is your schedule?"
        hint="Timing matters alongside duration. Shift work adjusts your targets rather than costing you points."
        name="sleepPattern"
        value={answers.sleepPattern}
        onChange={(value) => setAnswers({ sleepPattern: value })}
        options={[
          { value: "regular", label: "Similar times most days" },
          { value: "variable", label: "Varies a lot" },
          { value: "shift", label: "Shift work" },
        ]}
      />

      <ChoiceGroup
        legend="Sleep disorder context"
        hint="This adds context to duration and circadian regularity; PreSeed does not diagnose a sleep disorder."
        name="sleepDisorder"
        value={answers.sleepDisorder}
        onChange={(value) => setAnswers({ sleepDisorder: value })}
        options={[
          { value: "none", label: "No known sleep disorder" },
          { value: "suspected", label: "Possible or being assessed" },
          { value: "diagnosed", label: "Clinician-diagnosed sleep disorder" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <ChoiceGroup
        legend="Nicotine"
        hint="Amount and duration both matter, so this asks for a level rather than yes or no."
        name="smoking"
        value={answers.smoking}
        onChange={(value) => setAnswers({ smoking: value })}
        options={[
          { value: "never", label: "Never smoked" },
          { value: "former", label: "Former smoker" },
          { value: "vape_only", label: "Vape or pouches only", note: "Weighted cautiously — this evidence is less mature." },
          { value: "under10", label: "Under 10 cigarettes a day" },
          { value: "over10", label: "10 or more a day" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      {answers.smoking && !["never", "prefer_not"].includes(answers.smoking) ? (
        <ChoiceGroup
          legend="Cumulative cigarette or nicotine exposure"
          hint="Duration changes the score alongside current amount. An estimate is enough."
          name="smokingExposureYears"
          value={answers.smokingExposureYears}
          onChange={(value) => setAnswers({ smokingExposureYears: value })}
          options={[
            { value: "under5", label: "Under 5 years" },
            { value: "5to10", label: "5 to 10 years" },
            { value: "over10", label: "More than 10 years" },
            { value: "prefer_not", label: "Prefer not to say" },
          ]}
        />
      ) : null}

      <ChoiceGroup
        legend="Alcohol in a typical week"
        hint="Roughly. A pint of ordinary-strength beer is about 2 units; a large glass of wine is about 3."
        name="alcoholUnits"
        value={answers.alcoholUnits}
        onChange={(value) => setAnswers({ alcoholUnits: value })}
        columns={2}
        options={[
          { value: "none", label: "None" },
          { value: "1to7", label: "1 to 7 units" },
          { value: "8to14", label: "8 to 14 units" },
          { value: "over14", label: "Over 14 units" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <ChoiceGroup
        legend="Which describes your diet best?"
        hint="Evidence is much stronger for whole dietary patterns than for individual foods or supplements."
        name="dietPattern"
        value={answers.dietPattern}
        onChange={(value) => setAnswers({ dietPattern: value })}
        options={[
          {
            value: "mediterranean",
            label: "Lots of vegetables, fish, nuts and olive oil",
          },
          { value: "mixed", label: "A mix of home cooking and convenience food" },
          { value: "western", label: "Mostly processed food, takeaways and sugary drinks" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <ChoiceGroup
        legend="Metabolic and body-composition context"
        hint="Used as context for a modifiable readiness score, never to diagnose a condition. Diabetes reported in clinical history is also included."
        name="metabolicContext"
        value={answers.metabolicContext}
        onChange={(value) => setAnswers({ metabolicContext: value })}
        options={[
          { value: "supportive", label: "No known metabolic or central-weight concern" },
          { value: "overweight", label: "Overweight" },
          { value: "central_adiposity", label: "Weight carried mainly around my waist" },
          { value: "obesity", label: "Obesity" },
          { value: "insulin_resistance", label: "Known insulin resistance" },
          { value: "metabolic_syndrome", label: "Known metabolic syndrome" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <ChoiceGroup
        legend="Current energy balance"
        hint="Severe restriction and metabolic disruption are different from gradual, supported weight loss."
        name="energyBalance"
        value={answers.energyBalance}
        onChange={(value) => setAnswers({ energyBalance: value })}
        options={[
          { value: "stable", label: "Stable intake or gradual change" },
          { value: "moderate_deficit", label: "Moderate planned calorie deficit" },
          { value: "severe_restriction", label: "Severe energy restriction" },
          { value: "metabolic_disruption", label: "Recent major metabolic disruption or rapid weight change" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <ChoiceGroup
        legend="Fruit and vegetables a day"
        name="produceServings"
        value={answers.produceServings}
        onChange={(value) => setAnswers({ produceServings: value })}
        columns={2}
        options={[
          { value: "under2", label: "Under 2 portions" },
          { value: "2to4", label: "2 to 4 portions" },
          { value: "over4", label: "More than 4" },
        ]}
      />

      <ChoiceGroup
        legend="Exercise sessions a week"
        hint="This is a curve, not a ladder. Moderate activity is the target; only sustained high load without recovery is flagged."
        name="activitySessions"
        value={answers.activitySessions}
        onChange={(value) => setAnswers({ activitySessions: value })}
        columns={2}
        options={[
          { value: "none", label: "None" },
          { value: "1to2", label: "1 to 2" },
          { value: "3to5", label: "3 to 5" },
          { value: "over5", label: "More than 5" },
        ]}
      />

      {answers.activitySessions === "over5" ? (
        <ChoiceGroup
          legend="How is your recovery between sessions?"
          hint="Asked only because you train often. Sustained high load with poor recovery is the one part of the exercise picture that counts against you, and only mildly."
          name="trainingLoad"
          value={answers.trainingLoad}
          onChange={(value) => setAnswers({ trainingLoad: value })}
          options={[
            { value: "moderate", label: "Mostly moderate sessions" },
            { value: "high_recovered", label: "Hard, but I recover well" },
            { value: "high_underrecovered", label: "Hard, and I feel persistently drained" },
          ]}
        />
      ) : null}

      <ChoiceGroup
        legend="Sitting on a typical day"
        name="sedentaryHours"
        value={answers.sedentaryHours}
        onChange={(value) => setAnswers({ sedentaryHours: value })}
        columns={2}
        options={[
          { value: "under4", label: "Under 4 hours" },
          { value: "4to8", label: "4 to 8 hours" },
          { value: "over8", label: "Over 8 hours" },
        ]}
      />

      <ChoiceGroup
        legend="Heat exposure — select any that apply"
        hint="Repeated scrotal heat has limited but real human evidence. Occasional exposure carries very little weight."
        name="heatExposure"
        multiple
        value={answers.heatExposure}
        onChange={(value) => setAnswers({ heatExposure: toggle(answers.heatExposure, value) })}
        options={[
          { value: "sauna_hot_tub", label: "Sauna or hot tub most weeks" },
          { value: "occupational", label: "Hot working environment" },
          { value: "prolonged_sitting", label: "Long periods sitting, including driving" },
          { value: "laptop", label: "Laptop on my lap", note: "Counted as heat only. The radiation framing is not supported." },
          { value: "none", label: "None of these" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <ChoiceGroup
        legend="Recent high fever"
        hint="A recent fever changes how a semen result is interpreted for roughly one sperm-production cycle."
        name="recentFever"
        value={answers.recentFever}
        onChange={(value) => setAnswers({ recentFever: value })}
        options={[
          { value: "none", label: "None in the last 3 months" },
          { value: "last_month", label: "Within the last month" },
          { value: "last_3_months", label: "1 to 3 months ago" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <Card>
        <Disclosure label="Why these questions and not more" glyph="info" defaultOpen>
          <p className="t-body-sm text-ink-2">
            Every question here maps to a domain in your readiness score with published human evidence
            behind it. Questions that would not change your plan are not asked. Where evidence is weak —
            laptops, sitting — the question is still asked, but it carries a small weight and the plan
            says so.
          </p>
        </Disclosure>
      </Card>
    </FlowShell>
  );
}
