/**
 * User-set goals.
 *
 * Targets sit on the four logged behaviour domains, so progress is measured
 * against data the app already holds rather than self-report.
 *
 * Two constraints. Goals are behavioural only — there is no "get concentration
 * to 20" target, because the product cannot promise a parameter change and a
 * missed clinical target is not a failure a man should be shown. And a goal
 * that is not met renders as distance remaining, never as a failure state.
 */

import type { BehaviourDomainId } from "@/lib/behaviour-score";

export type GoalId = "sleep" | "diet" | "activity" | "adherence";

export type GoalDefinition = {
  id: GoalId;
  domain: BehaviourDomainId;
  label: string;
  unit: string;
  /** Sensible defaults, all reachable. */
  options: number[];
  fallback: number;
  /** How the live value is phrased. */
  format: (value: number) => string;
};

export const goalCatalogue: Record<GoalId, GoalDefinition> = {
  sleep: {
    id: "sleep",
    domain: "sleep",
    label: "Sleep per night",
    unit: "hours",
    options: [6.5, 7, 7.5, 8],
    fallback: 7.5,
    // Rounded, because the "to go" figure is a subtraction of two floats.
    format: (value) => `${Number(value.toFixed(1))}h`,
  },
  diet: {
    id: "diet",
    domain: "diet",
    label: "Diet pattern score",
    unit: "/100",
    options: [50, 60, 70, 80],
    fallback: 70,
    format: (value) => `${Math.round(value)}`,
  },
  activity: {
    id: "activity",
    domain: "activity",
    label: "Steps per day",
    unit: "steps",
    options: [6000, 8000, 10000, 12000],
    fallback: 8000,
    format: (value) => Math.round(value).toLocaleString("en-GB"),
  },
  adherence: {
    id: "adherence",
    domain: "adherence",
    label: "Protocol adherence",
    unit: "%",
    options: [60, 70, 80, 90],
    fallback: 80,
    format: (value) => `${Math.round(value)}%`,
  },
};

export type Goal = { id: GoalId; target: number };

export const defaultGoals: Goal[] = [
  { id: "sleep", target: 7.5 },
  { id: "activity", target: 8000 },
];

export type GoalProgress = {
  goal: Goal;
  definition: GoalDefinition;
  /** Live value over the trailing week. Null when nothing was logged. */
  current: number | null;
  /** 0–100, capped. Null when there is no current value. */
  percent: number | null;
  met: boolean;
};

export function evaluateGoal(goal: Goal, current: number | null): GoalProgress {
  const definition = goalCatalogue[goal.id];
  const percent =
    current == null ? null : Math.max(0, Math.min(100, Math.round((current / goal.target) * 100)));
  return {
    goal,
    definition,
    current,
    percent,
    met: current != null && current >= goal.target,
  };
}
