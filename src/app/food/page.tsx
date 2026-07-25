"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { MetricTile } from "@/components/score";
import { DisclaimerFooter, Screen } from "@/components/shell";
import {
  Button,
  Card,
  MetaBadge,
  SectionHeader,
  Segmented,
  SimulatedBadge,
  StatusChip,
  announce,
} from "@/components/ui";
import { TODAY, formatDate } from "@/lib/format";
import {
  confidenceCopy,
  dietDayFor,
  dietHistory,
  foodGroupDirection,
  foodGroupLabel,
  mealSlotLabel,
  recogniseFrame,
  recognitionLimits,
  scoreDietDay,
  type FoodEntry,
  type FoodItem,
  type MealSlot,
} from "@/lib/nutrition";

type Stage = "idle" | "reviewing";

/**
 * Food capture.
 *
 * The camera pattern is borrowed from Cal AI because it genuinely removes entry
 * friction. The promise behind it is not: this does not photograph a plate and
 * return a number. Recognition returns structured items with a stated
 * confidence and its own list of what it could not determine, and nothing
 * reaches the log until the user confirms it. That correction loop is one
 * reviewable list with a single commit, not a wizard.
 *
 * The day is scored on dietary *pattern*, never on calories, because pattern is
 * what the evidence base actually supports.
 */
export default function FoodPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [frame, setFrame] = useState(0);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [committed, setCommitted] = useState<FoodEntry[]>([]);

  const plate = useMemo(() => recogniseFrame(frame), [frame]);
  const today = useMemo(() => dietDayFor(TODAY), []);
  const recent = useMemo(() => dietHistory(14), []);

  const allEntries = [...today.entries, ...committed];
  const dayScore = scoreDietDay(allEntries);

  const loggedDays = recent.filter((day) => day.score != null);
  const meanScore =
    loggedDays.length === 0
      ? null
      : Math.round(
          loggedDays.reduce((sum, day) => sum + (day.score ?? 0), 0) / loggedDays.length,
        );

  function capture() {
    const next = frame + 1;
    setFrame(next);
    const recognised = recogniseFrame(next);
    setItems(
      recognised.items.map((item, index) => ({ ...item, id: `capture-${next}-${index}` })),
    );
    setStage("reviewing");
    announce(`${recognised.items.length} items recognised. Confirm or remove each one.`);
  }

  function commit() {
    const entry: FoodEntry = {
      id: `entry-${Date.now()}`,
      date: TODAY,
      slot,
      items,
      capture: "camera",
      confirmed: true,
    };
    setCommitted((previous) => [...previous, entry]);
    setStage("idle");
    setItems([]);
    announce("Meal saved to today's log.");
  }

  return (
    <Screen title="Food" eyebrow={formatDate(TODAY)} back="/today">
      <div className="grid grid-cols-2 gap-3">
        <MetricTile
          glyph="food"
          label="Today's pattern"
          value={dayScore.score == null ? "—" : String(dayScore.score)}
          unit={dayScore.score == null ? undefined : "/100"}
          detail={`${allEntries.length} meal${allEntries.length === 1 ? "" : "s"} logged`}
          tone="accent"
        />
        <MetricTile
          glyph="results"
          label="14-day mean"
          value={meanScore == null ? "—" : String(meanScore)}
          unit={meanScore == null ? undefined : "/100"}
          detail={`${loggedDays.length} of 14 days logged`}
        />
      </div>

      {/* ---------------------------------------------------------------- */}

      {stage === "idle" ? (
        <Card className="mt-4">
          <SectionHeader eyebrow="Add a meal" title="Photograph the plate" level={2} />

          <div className="flex aspect-[4/3] items-center justify-center rounded-sm border border-dashed border-line-control bg-surface-3">
            <div className="text-center">
              <Icon name="camera" size={32} className="mx-auto text-ink-3" />
              <p className="mt-2 t-caption text-ink-3">Simulated camera</p>
            </div>
          </div>

          <div className="mt-3">
            <Segmented<MealSlot>
              label="Meal"
              value={slot}
              onChange={setSlot}
              options={[
                { value: "breakfast", label: "Breakfast" },
                { value: "lunch", label: "Lunch" },
                { value: "dinner", label: "Dinner" },
              ]}
            />
          </div>

          <Button full glyph="camera" className="mt-3" onClick={capture}>
            Capture
          </Button>

          {/*
            The limits are stated at the moment of capture, not in terms of
            service. This is the specific correction the market review asked
            for: constraints must guide behaviour before effort is invested.
          */}
          <ul className="mt-3 space-y-1.5 border-t border-hairline pt-3">
            {recognitionLimits.map((limit) => (
              <li key={limit} className="flex gap-2 t-caption text-ink-3">
                <Icon name="info" size={13} className="mt-0.5 shrink-0" />
                {limit}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="mt-4" tone={plate.confidence === "low" ? "attention" : undefined}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="t-micro text-ink-3">Recognised</p>
              <h2 className="mt-1 t-title-2 text-ink-1">{plate.label}</h2>
            </div>
            <SimulatedBadge compact />
          </div>

          <div className="mt-2.5">
            <StatusChip
              tone={
                plate.confidence === "high"
                  ? "supported"
                  : plate.confidence === "moderate"
                    ? "attention"
                    : "escalation"
              }
              glyph={plate.confidence === "high" ? "check-circle" : "attention"}
            >
              {plate.confidence} confidence
            </StatusChip>
          </div>
          <p className="mt-2 t-body-sm text-ink-2">{confidenceCopy[plate.confidence]}</p>

          <div className="mt-4">
            <p className="t-micro text-ink-3">Items — remove anything wrong</p>
            <ul className="mt-2 space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-sm border border-hairline p-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block t-body-sm text-ink-1">{item.label}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <MetaBadge
                        glyph={
                          foodGroupDirection[item.group] === "adverse" ? "attention" : "results"
                        }
                      >
                        {foodGroupLabel[item.group]}
                      </MetaBadge>
                      <span className="t-mono text-ink-3">
                        {item.portions} portion{item.portions === 1 ? "" : "s"}
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setItems((previous) => previous.filter((row) => row.id !== item.id))}
                    aria-label={`Remove ${item.label}`}
                    className="flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-3 hover:bg-surface-3 hover:text-ink-1"
                  >
                    <Icon name="close" size={17} />
                  </button>
                </li>
              ))}
            </ul>
            {items.length === 0 ? (
              <p className="mt-2 t-caption text-ink-3">
                Every item removed. Capture again or go back.
              </p>
            ) : null}
          </div>

          <div className="mt-4 border-t border-hairline pt-3">
            <p className="t-micro text-ink-3">What this could not determine</p>
            <ul className="mt-1.5 space-y-1.5">
              {plate.uncertainties.map((line) => (
                <li key={line} className="flex gap-2 t-caption text-ink-2">
                  <Icon name="info" size={13} className="mt-0.5 shrink-0 text-ink-3" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="secondary" full onClick={() => setStage("idle")}>
              Discard
            </Button>
            <Button full disabled={items.length === 0} onClick={commit}>
              Confirm {items.length} item{items.length === 1 ? "" : "s"}
            </Button>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------------------- */}

      <section className="mt-6" aria-labelledby="log">
        <SectionHeader id="log" eyebrow="Today" title="Logged meals" level={2} />
        {allEntries.length === 0 ? (
          <Card>
            <p className="t-body-sm text-ink-2">Nothing logged today yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {allEntries.map((entry) => (
              <Card key={entry.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="t-title-3 text-ink-1">{mealSlotLabel[entry.slot]}</h3>
                  <MetaBadge glyph={entry.capture === "camera" ? "camera" : "hand"}>
                    {entry.capture === "camera" ? "Photo, confirmed" : "Entered by hand"}
                  </MetaBadge>
                </div>
                <ul className="mt-2 space-y-1">
                  {entry.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 t-body-sm">
                      <span className="text-ink-2">{item.label}</span>
                      <span className="shrink-0 t-mono text-ink-3">
                        {foodGroupLabel[item.group]}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card className="mt-6" tone="information">
        <div className="flex gap-3">
          <Icon name="info" size={20} className="mt-0.5 shrink-0 text-information" />
          <div>
            <h2 className="t-title-3 text-ink-1">Pattern, not calories</h2>
            <p className="mt-1.5 t-body-sm text-ink-2">
              This log scores how closely your days resemble the dietary pattern the evidence
              supports — produce, oily fish, wholegrains, legumes and olive oil, against processed
              meat and ultra-processed food. It does not count calories, and no single meal is
              judged on its own.
            </p>
          </div>
        </div>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
