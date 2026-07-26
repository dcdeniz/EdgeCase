import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeGoogleHealthRows,
  type GoogleHealthDailySummary,
} from "./wearable-source.ts";

const row = (overrides: Partial<GoogleHealthDailySummary> = {}): GoogleHealthDailySummary => ({
  observed_on: "2026-07-25",
  source: "google_health",
  steps: null,
  active_minutes: null,
  resting_heart_rate: null,
  sleep_minutes: null,
  sleep_stages: {},
  synced_at: "2026-07-26T00:00:00Z",
  ...overrides,
});

test("real rows retain provenance and take the real-data path", () => {
  const data = normalizeGoogleHealthRows([row({ steps: 8123 })]);
  assert.equal(data?.sourceLabel, "Google Health");
  assert.equal(data?.healthDays[0].steps, 8123);
});

test("an empty account result selects the caller's simulated fallback", () => {
  assert.equal(normalizeGoogleHealthRows([]), null);
});

test("mixed missing observations stay null and are never zero-filled", () => {
  const data = normalizeGoogleHealthRows([
    row({ observed_on: "2026-07-24", sleep_minutes: 430 }),
    row({ observed_on: "2026-07-25", steps: 0 }),
  ]);
  assert.equal(data?.sleepNights.length, 1);
  assert.equal(data?.healthDays[0].steps, null);
  assert.equal(data?.healthDays[1].steps, 0);
  assert.equal(data?.healthDays[1].restingHeartRate, null);
  assert.equal(data?.sleepNights[0].stages.deep, null);
});
