import { useEffect, useMemo, useState } from "react";
import {
  getGoogleHealthDailySummaries,
  type GoogleHealthDailySummary,
} from "@/lib/google-health-client";
import { normalizeGoogleHealthRows } from "@/lib/wearable-source";
import {
  healthHistory,
  sleepHistory,
  type HealthDay,
  type SleepNight,
  WEARABLE_SOURCE_LABEL,
} from "@/lib/wearable";

export type AccountWearableData = {
  source: "google_health" | "simulated";
  sourceLabel: "Google Health" | "Simulated Fitbit";
  sleepNights: SleepNight[];
  healthDays: HealthDay[];
};

export function adaptGoogleHealthRows(
  rows: GoogleHealthDailySummary[],
): AccountWearableData | null {
  return normalizeGoogleHealthRows(rows);
}

export function simulatedWearableData(days = 365): AccountWearableData {
  return {
    source: "simulated",
    sourceLabel: WEARABLE_SOURCE_LABEL,
    sleepNights: sleepHistory(days),
    healthDays: healthHistory(days),
  };
}

export function resolveWearableData(
  rows: GoogleHealthDailySummary[],
  fallbackDays = 365,
) {
  return adaptGoogleHealthRows(rows) ?? simulatedWearableData(fallbackDays);
}

export function useAccountWearableData(days = 365) {
  const fallback = useMemo(() => simulatedWearableData(days), [days]);
  const [data, setData] = useState<AccountWearableData>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getGoogleHealthDailySummaries()
      .then((rows) => {
        if (active) setData(resolveWearableData(rows, days));
      })
      .catch(() => {
        if (active) setData(fallback);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days, fallback]);

  return { data, loading };
}

export const latestSleepFrom = (data: AccountWearableData) =>
  data.sleepNights.at(-1) ?? null;

export const latestHealthFrom = (data: AccountWearableData) =>
  data.healthDays.at(-1) ?? null;
