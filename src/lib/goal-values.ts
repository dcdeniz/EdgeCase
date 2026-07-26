/**
 * Live values for goals measured in their own units rather than as a 0–100
 * domain score. Sleep is hours per night and activity is steps per day, both
 * over the trailing week, which is what a user actually sets a target in.
 */

import { mean, healthHistory, sleepHistory } from "@/lib/wearable";

export function liveGoalValues(): Record<"sleep" | "activity", number | null> {
  const nights = sleepHistory(7);
  const days = healthHistory(7);
  const meanSleep = mean(nights.map((night) => night.asleepMinutes));
  const meanSteps = mean(days.map((day) => day.steps).filter((value): value is number => value != null));

  return {
    sleep: meanSleep == null ? null : Number((meanSleep / 60).toFixed(1)),
    activity: meanSteps == null ? null : Math.round(meanSteps),
  };
}
