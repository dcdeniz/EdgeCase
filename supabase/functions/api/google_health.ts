export const GOOGLE_HEALTH_SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
] as const;

const encoder = new TextEncoder();

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_")
    .replaceAll("=", "");

const fromBase64Url = (value: string) => {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
  );
}

export async function createGoogleHealthState(
  userId: string,
  secret: string,
  now = Date.now(),
) {
  const payload = base64Url(encoder.encode(JSON.stringify({
    userId,
    expiresAt: now + 10 * 60 * 1000,
    nonce: crypto.randomUUID(),
  })));
  return `${payload}.${base64Url(await hmac(payload, secret))}`;
}

export async function verifyGoogleHealthState(
  state: string,
  secret: string,
  now = Date.now(),
) {
  const [payload, signature, extra] = state.split(".");
  if (!payload || !signature || extra) return null;
  const expected = await hmac(payload, secret);
  const supplied = fromBase64Url(signature);
  if (expected.length !== supplied.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected[index] ^ supplied[index];
  }
  if (mismatch !== 0) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return typeof parsed.userId === "string" && parsed.expiresAt >= now
      ? { userId: parsed.userId as string }
      : null;
  } catch {
    return null;
  }
}

export function googleHealthAuthorizationUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_HEALTH_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", input.state);
  return url.toString();
}

type CivilDate = { year?: number; month?: number; day?: number };
type CivilDateTime = { date?: CivilDate };

export const civilDateString = (value: CivilDateTime | undefined) => {
  const date = value?.date;
  if (!date?.year || !date.month || !date.day) return null;
  return `${date.year}-${String(date.month).padStart(2, "0")}-${
    String(date.day).padStart(2, "0")
  }`;
};

export type WearableDailySummary = {
  date: string;
  steps: number | null;
  activeMinutes: number | null;
  restingHeartRate: number | null;
  sleepMinutes: number | null;
  sleepStages: Record<string, number>;
};

const finiteNumber = (value: unknown) => {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export function mergeGoogleHealthData(
  stepsPayload: unknown,
  activePayload: unknown,
  heartPayload: unknown,
  sleepPayload: unknown,
) {
  const days = new Map<string, WearableDailySummary>();
  const day = (date: string) => {
    const existing = days.get(date);
    if (existing) return existing;
    const created: WearableDailySummary = {
      date,
      steps: null,
      activeMinutes: null,
      restingHeartRate: null,
      sleepMinutes: null,
      sleepStages: {},
    };
    days.set(date, created);
    return created;
  };
  const rollups = (payload: unknown) =>
    payload && typeof payload === "object" &&
      Array.isArray((payload as Record<string, unknown>).rollupDataPoints)
      ? (payload as { rollupDataPoints: Array<Record<string, unknown>> })
        .rollupDataPoints
      : [];
  for (const point of rollups(stepsPayload)) {
    const date = civilDateString(point.civilStartTime as CivilDateTime);
    const count = finiteNumber(
      (point.steps as Record<string, unknown> | undefined)?.countSum,
    );
    if (date && count != null) day(date).steps = count;
  }
  for (const point of rollups(activePayload)) {
    const date = civilDateString(point.civilStartTime as CivilDateTime);
    const value = point.activeMinutes as Record<string, unknown> | undefined;
    const levels = Array.isArray(value?.activeMinutesRollupByActivityLevel)
      ? value.activeMinutesRollupByActivityLevel as Array<
        Record<string, unknown>
      >
      : [];
    const observed = levels.map((level) => finiteNumber(level.activeMinutesSum))
      .filter((value): value is number => value != null);
    if (date && observed.length > 0) {
      day(date).activeMinutes = observed.reduce((total, amount) => total + amount, 0);
    }
  }
  for (const point of rollups(heartPayload)) {
    const date = civilDateString(point.civilStartTime as CivilDateTime);
    const value = point.restingHeartRatePersonalRange as
      | Record<string, unknown>
      | undefined;
    const minimum = finiteNumber(value?.beatsPerMinuteMin);
    const maximum = finiteNumber(value?.beatsPerMinuteMax);
    if (date && minimum != null && maximum != null) {
      day(date).restingHeartRate = Math.round((minimum + maximum) / 2);
    }
  }
  const reconciled = sleepPayload && typeof sleepPayload === "object" &&
      Array.isArray(
        (sleepPayload as Record<string, unknown>).reconciledDataPoints,
      )
    ? (sleepPayload as { reconciledDataPoints: Array<Record<string, unknown>> })
      .reconciledDataPoints
    : [];
  for (const point of reconciled) {
    const sleep = point.sleep as Record<string, unknown> | undefined;
    const interval = sleep?.interval as Record<string, unknown> | undefined;
    const date = civilDateString(interval?.civilEndTime as CivilDateTime);
    const summary = sleep?.summary as Record<string, unknown> | undefined;
    const minutes = finiteNumber(summary?.minutesAsleep);
    if (!date || minutes == null) continue;
    const target = day(date);
    target.sleepMinutes = (target.sleepMinutes ?? 0) + minutes;
    const stages = Array.isArray(summary?.stagesSummary)
      ? summary.stagesSummary as Array<Record<string, unknown>>
      : [];
    for (const stage of stages) {
      if (typeof stage.type !== "string") continue;
      const stageMinutes = finiteNumber(stage.minutes);
      if (stageMinutes != null) {
        target.sleepStages[stage.type.toLowerCase()] =
          (target.sleepStages[stage.type.toLowerCase()] ?? 0) + stageMinutes;
      }
    }
  }
  return [...days.values()].sort((left, right) =>
    left.date.localeCompare(right.date)
  );
}
