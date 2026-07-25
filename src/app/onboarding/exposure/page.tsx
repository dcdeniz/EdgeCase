"use client";

import { useRouter } from "next/navigation";
import { FlowShell } from "@/components/shell";
import { Button, Card, ChoiceGroup, Disclosure, PendingIntegration } from "@/components/ui";
import { usePrototype } from "@/lib/store";

function toggle(list: string[] | undefined, value: string) {
  const current = list ?? [];
  if (value === "none" || value === "prefer_not") return [value];
  const next = current.filter((entry) => entry !== "none" && entry !== "prefer_not");
  return next.includes(value) ? next.filter((entry) => entry !== value) : [...next, value];
}

export default function ExposurePage() {
  const router = useRouter();
  const { state, setAnswers } = usePrototype();

  return (
    <FlowShell
      step={9}
      total={10}
      stepLabel="Exposure"
      back="/onboarding/health"
      title="Environmental and occupational exposure"
      intro="The evidence here ranges from reasonably consistent to genuinely early. Your plan says which is which rather than treating them all the same."
      footer={
        <Button full size="lg" glyphAfter="chevron-right" onClick={() => router.push("/onboarding/review")}>
          Continue
        </Button>
      }
    >
      <ChoiceGroup
        legend="Which of these apply to you?"
        name="exposures"
        multiple
        value={state.answers.exposures}
        onChange={(value) => setAnswers({ exposures: toggle(state.answers.exposures, value) })}
        options={[
          {
            value: "air_quality",
            label: "I live somewhere with noticeable air pollution",
            note: "Reasonably consistent evidence. Indoor filtration is the best-evidenced response.",
          },
          {
            value: "chemicals",
            label: "I work with solvents, fumes, metals or industrial chemicals",
            note: "Occupational exposure carries more weight than anything domestic.",
          },
          {
            value: "pesticides",
            label: "I handle pesticides or herbicides",
            note: "Occupational contact, not supermarket produce.",
          },
          {
            value: "plastics",
            label: "I often eat or drink from plastic, including reheating in it",
            note: "Emerging evidence only. Low-cost to reduce, so worth doing without over-claiming.",
          },
          { value: "none", label: "None of these" },
          { value: "prefer_not", label: "Prefer not to say" },
        ]}
      />

      <Card className="mb-4">
        <Disclosure label="What the evidence actually supports" glyph="info" defaultOpen>
          <p className="t-body-sm text-ink-2">
            Most exposure evidence is associative, and much of it comes from occupational settings with
            far higher exposure than a typical day. The honest framing is that these are modifiable
            exposures worth reducing — especially if your measurements are already near a reference
            limit — not established causes of any individual result. Reducing exposure lowers oxidative
            stress on sperm. It is not a promised increase in a number.
          </p>
        </Disclosure>
        <Disclosure label="Why microplastics are here but weighted lightly" glyph="attention">
          <p className="t-body-sm text-ink-2">
            Microplastics have been found in human semen, and small studies associate plastic-tableware
            use with poorer measurements. But the studies are small, attributing a source is difficult,
            and there is no intervention evidence at all. So PreSeed logs it, keeps its weight small, and
            refuses to convert it into a claim like &ldquo;one fewer plastic cup equals a known change&rdquo;.
          </p>
        </Disclosure>
      </Card>

      <PendingIntegration
        title="Live air-quality tracking"
        body="PM2.5 and NO₂ for your area would refine this domain daily and trigger same-day actions on high-pollution days. It needs a location permission and an air-quality provider, neither of which is connected."
        dependency="POST /v1/environment/snapshots and an AQI provider"
      />
    </FlowShell>
  );
}
