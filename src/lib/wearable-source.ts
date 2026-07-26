export type GoogleHealthDailySummary = {
  observed_on: string;
  source: "google_health";
  steps: number | null;
  active_minutes: number | null;
  resting_heart_rate: number | null;
  sleep_minutes: number | null;
  sleep_stages: Record<string, number>;
  synced_at: string;
};

const stage = (raw: Record<string, number>, name: string) =>
  Number.isFinite(raw[name]) ? raw[name] : null;

export function normalizeGoogleHealthRows(rows: GoogleHealthDailySummary[]) {
  if (rows.length === 0) return null;
  const ordered = [...rows].sort((left, right) =>
    left.observed_on.localeCompare(right.observed_on)
  );
  return {
    source: "google_health" as const,
    sourceLabel: "Google Health" as const,
    sleepNights: ordered.flatMap((row) =>
      row.sleep_minutes == null
        ? []
        : [{
            date: row.observed_on,
            asleepMinutes: row.sleep_minutes,
            needMinutes: 480,
            bedtime: null,
            wakeTime: null,
            stages: {
              deep: stage(row.sleep_stages ?? {}, "deep"),
              rem: stage(row.sleep_stages ?? {}, "rem"),
              light: stage(row.sleep_stages ?? {}, "light"),
              awake: stage(row.sleep_stages ?? {}, "awake"),
            },
            segments: null,
            bedtimeVarianceMinutes: null,
            source: "google_health" as const,
            sourceLabel: "Google Health" as const,
          }]
    ),
    healthDays: ordered.map((row) => ({
      date: row.observed_on,
      restingHeartRate: row.resting_heart_rate,
      heartRateVariability: null,
      steps: row.steps,
      activeMinutes: row.active_minutes,
      source: "google_health" as const,
      sourceLabel: "Google Health" as const,
    })),
  };
}
