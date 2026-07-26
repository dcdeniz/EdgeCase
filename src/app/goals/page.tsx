"use client";

import { useMemo } from "react";
import { Icon } from "@/components/icons";
import { DisclaimerFooter, Screen } from "@/components/shell";
import { Card, StatusChip, cx } from "@/components/ui";
import { behaviourWindow } from "@/lib/behaviour-score";
import { goalCatalogue, evaluateGoal, type GoalId } from "@/lib/goals";
import { liveGoalValues } from "@/lib/goal-values";
import { usePrototype } from "@/lib/store";

/**
 * Goal setting.
 *
 * Targets are behavioural only. There is no clinical target here — the product
 * cannot promise a parameter change, and a missed clinical target is not a
 * failure to show a man mid-protocol.
 */
export default function GoalsPage() {
  const { state, setGoal, clearGoal } = usePrototype();
  const week = useMemo(() => behaviourWindow(state, 7), [state]);
  const values = useMemo(() => liveGoalValues(), []);

  return (
    <Screen title="Goals" eyebrow="Behavioural targets" back="/today">
      <div className="space-y-3">
        {(Object.keys(goalCatalogue) as GoalId[]).map((id) => {
          const definition = goalCatalogue[id];
          const active = state.goals.find((goal) => goal.id === id);
          const current = id === "diet" || id === "adherence" ? week.domains[definition.domain] : values[id];
          const progress = active ? evaluateGoal(active, current) : null;

          return (
            <Card key={id}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="t-title-3 text-ink-1">{definition.label}</h2>
                {active ? (
                  <button
                    type="button"
                    onClick={() => clearGoal(id)}
                    className="shrink-0 t-caption text-accent"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              {progress ? (
                <>
                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <span className="t-title-2 text-ink-1 ps-num">
                      {progress.current == null ? "—" : definition.format(progress.current)}
                    </span>
                    <span className="t-caption text-ink-3">
                      target {definition.format(active!.target)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${progress.percent ?? 0}%` }}
                    />
                  </div>
                  <p className="mt-2">
                    {progress.current == null ? (
                      <StatusChip tone="unavailable" glyph="unavailable">
                        Nothing logged
                      </StatusChip>
                    ) : progress.met ? (
                      <StatusChip tone="supported" glyph="check-circle">
                        Met this week
                      </StatusChip>
                    ) : (
                      <span className="t-caption text-ink-2">
                        {definition.format(active!.target - progress.current)} to go
                      </span>
                    )}
                  </p>
                </>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {definition.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGoal({ id, target: option })}
                    aria-pressed={active?.target === option}
                    className={cx(
                      "min-h-11 rounded-sm border px-3 t-body-sm",
                      active?.target === option
                        ? "border-accent bg-accent-quiet font-medium text-accent"
                        : "border-line-control text-ink-1 hover:bg-surface-3",
                    )}
                  >
                    {definition.format(option)}
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-4 flex gap-2 t-caption text-ink-3">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        Behavioural targets only. Progress is shown as distance remaining, never as a missed streak.
      </p>

      <DisclaimerFooter />
    </Screen>
  );
}
