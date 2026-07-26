"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { FlowShell } from "@/components/shell";
import {
  Button,
  Card,
  ChoiceGroup,
  Field,
  MetaBadge,
  PendingIntegration,
  Segmented,
  Select,
  SimulatedBadge,
  StatusChip,
  TextInput,
  UnitInput,
  announce,
} from "@/components/ui";
import {
  type ClinicalTest,
  type MarkerCode,
  type MarkerValue,
  type TestSource,
  hormoneMarkerOrder,
  markerCatalogue,
  semenMarkerOrder,
} from "@/lib/clinical";
import { demoBaseline, demoHormonePanel, demoRetest } from "@/lib/fixtures";
import { TODAY, formatDate } from "@/lib/format";
import { usePrototype } from "@/lib/store";
import { compileSemenProfile, persistClinicalTest } from "@/lib/data-engine-client";

type Mode = "manual" | "upload" | "simulated";
type Step = 1 | 2 | 3;

const entryCodes: MarkerCode[] = semenMarkerOrder;

export default function NewTestPage() {
  const router = useRouter();
  const { addTest, baselineSemen, semenTests } = usePrototype();

  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<Mode>("manual");
  const [panel, setPanel] = useState<"semen_analysis" | "hormone_panel">("semen_analysis");
  const [values, setValues] = useState<Partial<Record<MarkerCode, string>>>({});
  const [demoChoice, setDemoChoice] = useState<"baseline" | "retest" | "hormones">(
    semenTests.length === 0 ? "baseline" : "retest",
  );

  const [collectedAt, setCollectedAt] = useState(TODAY);
  const [labName, setLabName] = useState("");
  const [abstinence, setAbstinence] = useState(baselineSemen?.abstinenceHours?.toString() ?? "");
  const [complete, setComplete] = useState<"yes" | "no" | "unsure">("yes");
  const [fever, setFever] = useState<"no" | "yes">("no");
  const [saving, setSaving] = useState(false);

  const codes = panel === "semen_analysis" ? entryCodes : hormoneMarkerOrder.slice(0, 5);

  const enteredMarkers: MarkerValue[] = codes.flatMap((code) => {
    const raw = values[code];
    if (raw == null || raw.trim() === "") return [];
    const value = Number(raw);
    if (!Number.isFinite(value)) return [];
    return [{ code, value, unit: markerCatalogue[code].unit, verification: "user_entered" as const }];
  });

  const concentration = enteredMarkers.find((marker) => marker.code === "concentration_million_ml");
  const reportedZero = mode === "manual" && concentration?.value === 0;

  const buildTest = (): ClinicalTest => {
    if (mode === "simulated") {
      if (demoChoice === "baseline") return demoBaseline;
      if (demoChoice === "retest") return demoRetest;
      return demoHormonePanel;
    }
    return {
      // Deterministic, so re-rendering the review step cannot mint a new record.
      // One entry per collection date and panel is also the right domain rule.
      id: `test-${panel}-${collectedAt}`,
      testType: panel,
      source: mode as TestSource,
      collectedAt: `${collectedAt}T09:00:00Z`,
      labName: labName || null,
      abstinenceHours: abstinence ? Number(abstinence) : null,
      collectionComplete: complete === "unsure" ? null : complete === "yes",
      recentFever: fever === "yes",
      notes: null,
      markers: enteredMarkers,
      reportedAsZero: reportedZero,
    };
  };

  const canAdvance =
    step === 1
      ? mode === "simulated" || enteredMarkers.length > 0
      : true;

  const save = async () => {
    const test = buildTest();
    addTest(test);
    setSaving(true);
    try {
      await persistClinicalTest(test);
      if (test.testType === "semen_analysis") await compileSemenProfile();
      announce("Result saved and structured profile updated");
    } catch {
      announce("Result saved on this device; the data engine is currently unavailable");
    }
    setSaving(false);
    router.push(semenTests.length > 0 && test.testType === "semen_analysis" ? "/trends" : "/results");
  };

  return (
    <FlowShell
      step={step}
      total={3}
      stepLabel={step === 1 ? "Result" : step === 2 ? "Collection conditions" : "Review"}
      back={step === 1 ? "/today" : undefined}
      title={
        step === 1
          ? "Add a clinical result"
          : step === 2
            ? "How was the sample collected?"
            : "Check before saving"
      }
      intro={
        step === 1
          ? "PreSeed does not measure anything. It records what a laboratory measured, or clearly labelled demonstration data."
          : step === 2
            ? "These conditions decide whether this result can be compared with your next one. They matter as much as the values themselves."
            : undefined
      }
      footer={
        <div className="flex gap-2">
          {step > 1 ? (
            <Button variant="secondary" full onClick={() => setStep((step - 1) as Step)}>
              Back
            </Button>
          ) : null}
          {step < 3 ? (
            <Button
              full
              size="lg"
              glyphAfter="chevron-right"
              disabled={!canAdvance}
              onClick={() => setStep((step + 1) as Step)}
            >
              Continue
            </Button>
          ) : (
            <Button full size="lg" glyph="check" onClick={save} disabled={saving}>
              {saving ? "Building profile…" : "Save result"}
            </Button>
          )}
        </div>
      }
    >
      {step === 1 ? (
        <>
          <Segmented
            label="Entry method"
            value={mode}
            onChange={setMode}
            options={[
              { value: "manual", label: "Type it in", glyph: "pencil" },
              { value: "upload", label: "Upload", glyph: "upload" },
              { value: "simulated", label: "Sample", glyph: "simulated" },
            ]}
          />

          {mode === "manual" ? (
            <div className="mt-5">
              <Segmented
                label="Panel"
                value={panel}
                onChange={setPanel}
                options={[
                  { value: "semen_analysis", label: "Semen analysis" },
                  { value: "hormone_panel", label: "Hormone panel" },
                ]}
              />

              <p className="mt-4 t-caption text-ink-3">
                Enter only what your report shows. Blank markers are recorded as not measured, which
                lowers your data confidence rather than being guessed at.
              </p>

              <div className="mt-4">
                {codes.map((code) => {
                  const definition = markerCatalogue[code];
                  return (
                    <Field
                      key={code}
                      label={definition.label}
                      htmlFor={code}
                      optional
                      hint={definition.meaning}
                    >
                      <UnitInput
                        id={code}
                        hint
                        unit={definition.unit}
                        placeholder="—"
                        value={values[code] ?? ""}
                        onChange={(event) =>
                          setValues((previous) => ({ ...previous, [code]: event.target.value }))
                        }
                      />
                    </Field>
                  );
                })}
              </div>

              {/* A manually entered zero is never a confirmed finding. */}
              {reportedZero ? (
                <Card tone="escalation">
                  <div className="flex gap-3">
                    <Icon name="escalation" size={20} className="mt-0.5 shrink-0 text-escalation" />
                    <div>
                      <h2 className="t-title-3 text-ink-1">A zero result needs laboratory confirmation</h2>
                      <p className="mt-1.5 t-body-sm text-ink-2">
                        PreSeed cannot confirm azoospermia. A zero or extremely low result requires
                        appropriate laboratory confirmation, which depends on examining the sediment of a
                        centrifuged sample.
                      </p>
                      <p className="mt-2 t-body-sm text-ink-2">
                        This will be recorded as <span className="font-medium text-ink-1">reported as zero,
                        confirmation required</span> — never as azoospermia.
                      </p>
                    </div>
                  </div>
                </Card>
              ) : null}
            </div>
          ) : null}

          {mode === "upload" ? (
            <div className="mt-5 space-y-3">
              <PendingIntegration
                title="Upload a laboratory report"
                body="A PDF or photo of your report would be read, and every extracted value shown to you for confirmation before it entered your profile — one reviewable list, not a wizard. Extraction confidence would be recorded alongside each value."
                dependency="POST /v1/uploads/intents, POST /v1/uploads/:id/confirm and an extraction service"
              />
              <Card>
                <p className="t-micro text-ink-3">What this would look like</p>
                <ol className="mt-2 space-y-2">
                  {[
                    "Choose the report file.",
                    "PreSeed extracts values, units and reference intervals.",
                    "You review every value inline and correct anything wrong.",
                    "Confirmed values are stored as lab report; anything you edited is stored as confirmed by you.",
                  ].map((line, index) => (
                    <li key={line} className="flex gap-2.5 t-body-sm text-ink-2">
                      <span className="t-mono text-ink-3">{index + 1}</span>
                      {line}
                    </li>
                  ))}
                </ol>
              </Card>
              <Button variant="secondary" full glyph="pencil" onClick={() => setMode("manual")}>
                Type the values in instead
              </Button>
            </div>
          ) : null}

          {mode === "simulated" ? (
            <div className="mt-5">
              <Card tone="information">
                <div className="flex gap-3">
                  <Icon name="simulated" size={20} className="mt-0.5 shrink-0 text-information" />
                  <div>
                    <h2 className="t-title-3 text-ink-1">Sample data</h2>
                    <p className="mt-1 t-body-sm text-ink-2">
                      These results describe nobody — a worked example for exploring the flow. A
                      laboratory report raises your data confidence.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="mt-4">
                <ChoiceGroup
                  legend="Which sample?"
                  name="demoChoice"
                  value={demoChoice}
                  onChange={setDemoChoice}
                  options={[
                    {
                      value: "baseline",
                      label: "Baseline semen analysis",
                      note: "18 April 2026. Concentration, both motility measures and morphology sit below their reference limits.",
                    },
                    {
                      value: "retest",
                      label: "Closing semen analysis",
                      note: "24 July 2026. Same laboratory, comparable abstinence. Enables the trend view.",
                    },
                    {
                      value: "hormones",
                      label: "Hormone panel",
                      note: "22 April 2026. All values inside the laboratory's intervals.",
                    },
                  ]}
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {step === 2 ? (
        <>
          {/* Feedforward: the conditions are explained before they are asked for. */}
          <Card tone="information">
            <div className="flex gap-3">
              <Icon name="info" size={20} className="mt-0.5 shrink-0 text-information" />
              <div>
                <h2 className="t-title-3 text-ink-1">Why this decides everything later</h2>
                <p className="mt-1 t-body-sm text-ink-2">
                  Abstinence duration alone changes volume and concentration independently of your
                  reproductive health. If two samples differ on these conditions, PreSeed will show the
                  comparison with a caution rather than quietly treating it as change.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-5">
            <Field label="Collection date" htmlFor="collectedAt">
              <TextInput
                id="collectedAt"
                type="date"
                value={collectedAt}
                onChange={(event) => setCollectedAt(event.target.value)}
              />
            </Field>

            <Field
              label="Abstinence before the sample"
              htmlFor="abstinence"
              hint={
                baselineSemen?.abstinenceHours != null
                  ? `Your baseline was ${baselineSemen.abstinenceHours} hours. Matching it keeps the two comparable.`
                  : "Hours since the previous ejaculation."
              }
            >
              <UnitInput
                id="abstinence"
                hint
                unit="hours"
                inputMode="numeric"
                value={abstinence}
                onChange={(event) => setAbstinence(event.target.value)}
              />
            </Field>

            <Field label="Laboratory or source" htmlFor="labName" optional hint="Different laboratories differ in method, so a change of laboratory is worth recording.">
              <TextInput
                id="labName"
                hint
                autoComplete="off"
                placeholder="Name of the laboratory"
                value={labName}
                onChange={(event) => setLabName(event.target.value)}
              />
            </Field>

            <Field label="Was the sample complete?" htmlFor="complete" hint="Losing part of the sample makes volume and total count read low for collection reasons.">
              <Select
                id="complete"
                hint
                value={complete}
                onChange={(event) => setComplete(event.target.value as typeof complete)}
              >
                <option value="yes">Yes, the whole sample was collected</option>
                <option value="no">No, part of it was lost</option>
                <option value="unsure">Not sure</option>
              </Select>
            </Field>

            <Field label="Fever or illness in the past three months?" htmlFor="fever" hint="Fever can suppress production for weeks, so a low result afterwards may reflect the illness.">
              <Select
                id="fever"
                hint
                value={fever}
                onChange={(event) => setFever(event.target.value as typeof fever)}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Select>
            </Field>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          {(() => {
            const test = buildTest();
            return (
              <>
                <Card>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="t-title-3 text-ink-1">
                      {test.testType === "semen_analysis" ? "Semen analysis" : "Hormone panel"}
                    </h2>
                    {test.source === "simulated" ? <SimulatedBadge compact /> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <MetaBadge glyph="calendar">{formatDate(test.collectedAt)}</MetaBadge>
                    <MetaBadge
                      glyph={test.source === "simulated" ? "simulated" : test.source === "upload" ? "upload" : "hand"}
                    >
                      {test.source === "manual" ? "Manual entry" : test.source === "upload" ? "Uploaded" : "Simulated"}
                    </MetaBadge>
                    {test.abstinenceHours != null ? (
                      <MetaBadge glyph="pending">{test.abstinenceHours}h abstinence</MetaBadge>
                    ) : null}
                    {test.labName ? <MetaBadge glyph="lab">{test.labName}</MetaBadge> : null}
                  </div>

                  <ul className="mt-3 divide-y divide-hairline border-t border-hairline">
                    {test.markers.map((marker) => {
                      const definition = markerCatalogue[marker.code];
                      return (
                        <li key={marker.code} className="flex items-baseline justify-between gap-4 py-2.5">
                          <span className="t-body-sm text-ink-2">{definition.label}</span>
                          <span className="t-mono text-ink-1">
                            {marker.value} <span className="text-ink-3">{definition.unit}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {test.markers.length === 0 ? (
                    <p className="mt-3 t-body-sm text-ink-3">No values entered.</p>
                  ) : null}
                </Card>

                {test.reportedAsZero ? (
                  <Card tone="escalation" className="mt-3">
                    <div className="flex gap-3">
                      <Icon name="escalation" size={20} className="mt-0.5 shrink-0 text-escalation" />
                      <div>
                        <p className="t-body-sm text-ink-1">
                          This will be saved as{" "}
                          <span className="font-medium">reported as zero, confirmation required</span>.
                          PreSeed cannot confirm azoospermia.
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : null}

                <Card className="mt-3">
                  <p className="t-micro text-ink-3">How this will be stored</p>
                  <ul className="mt-2 space-y-2">
                    {[
                      "Every value keeps its unit, source and verification state.",
                      "Clinical records are append-only. Corrections add a new record rather than overwriting one.",
                      "Collection conditions travel with the result, so future comparisons stay honest.",
                    ].map((line) => (
                      <li key={line} className="flex gap-2.5 t-caption text-ink-2">
                        <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </Card>

                {test.markers.some((marker) => marker.verification === "user_entered") ? (
                  <p className="mt-3">
                    <StatusChip tone="attention">
                      Typed values are stored as entered by you, not as a lab report
                    </StatusChip>
                  </p>
                ) : null}
              </>
            );
          })()}
        </>
      ) : null}
    </FlowShell>
  );
}
