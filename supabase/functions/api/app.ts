import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

type Variables = { requestId: string; user: User; supabase: SupabaseClient };
type AppEnv = { Variables: Variables };
const cors = {
  allowHeaders: "authorization, apikey, content-type, idempotency-key",
  allowMethods: "GET, POST, PUT, OPTIONS",
};
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requestIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const markerCodes = [
  "volume_ml",
  "concentration_million_ml",
  "total_count_million",
  "progressive_motility_pct",
  "total_motility_pct",
  "normal_morphology_pct",
  "dna_fragmentation_pct",
  "fsh_iu_l",
  "lh_iu_l",
  "total_testosterone_nmol_l",
  "free_testosterone_nmol_l",
  "estradiol_pmol_l",
  "prolactin_miu_l",
  "shbg_nmol_l",
  "tsh_miu_l",
] as const;
type MarkerCode = (typeof markerCodes)[number];
type ClinicalTestType = "semen_analysis" | "hormone_panel";
const markerMetadata: Record<
  MarkerCode,
  { testType: ClinicalTestType; unit: string }
> = {
  volume_ml: { testType: "semen_analysis", unit: "mL" },
  concentration_million_ml: {
    testType: "semen_analysis",
    unit: "million/mL",
  },
  total_count_million: { testType: "semen_analysis", unit: "million" },
  progressive_motility_pct: { testType: "semen_analysis", unit: "%" },
  total_motility_pct: { testType: "semen_analysis", unit: "%" },
  normal_morphology_pct: { testType: "semen_analysis", unit: "%" },
  dna_fragmentation_pct: { testType: "semen_analysis", unit: "%" },
  fsh_iu_l: { testType: "hormone_panel", unit: "IU/L" },
  lh_iu_l: { testType: "hormone_panel", unit: "IU/L" },
  total_testosterone_nmol_l: { testType: "hormone_panel", unit: "nmol/L" },
  free_testosterone_nmol_l: { testType: "hormone_panel", unit: "nmol/L" },
  estradiol_pmol_l: { testType: "hormone_panel", unit: "pmol/L" },
  prolactin_miu_l: { testType: "hormone_panel", unit: "mIU/L" },
  shbg_nmol_l: { testType: "hormone_panel", unit: "nmol/L" },
  tsh_miu_l: { testType: "hormone_panel", unit: "mIU/L" },
};

export const markerMatchesTest = (
  code: MarkerCode,
  unit: string,
  testType: ClinicalTestType,
) =>
  markerMetadata[code].testType === testType &&
  markerMetadata[code].unit === unit;

const envelope = (
  requestId: string,
  data: unknown,
  extra: Record<string, unknown> = {},
) => ({ data, meta: { requestId, contractVersion: "1", ...extra } });
const failure = (
  requestId: string,
  code: string,
  message: string,
  details: unknown[] = [],
) => ({ error: { code, message, requestId, details } });
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const asString = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() && value.length <= max
    ? value.trim()
    : null;
const asDate = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
const asUuid = (value: unknown) =>
  typeof value === "string" && uuidPattern.test(value) ? value : null;
const allowed = <T extends string>(
  value: unknown,
  values: readonly T[],
): value is T => typeof value === "string" && values.includes(value as T);

async function bodyOf(c: { req: { json: () => Promise<unknown> } }) {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use("*", async (c, next) => {
    const suppliedRequestId = c.req.header("x-request-id");
    const requestId =
      suppliedRequestId && requestIdPattern.test(suppliedRequestId)
        ? suppliedRequestId
        : crypto.randomUUID();
    c.set("requestId", requestId);
    c.header("x-request-id", requestId);
    c.header("Cache-Control", "no-store");
    c.header("Referrer-Policy", "no-referrer");
    c.header("X-Content-Type-Options", "nosniff");
    const origin = c.req.header("Origin");
    const allowedOrigins = new Set(
      (Deno.env.get("ALLOWED_ORIGINS") ??
        "http://localhost:3000,http://127.0.0.1:3000")
        .split(",").map((value) => value.trim()).filter(Boolean),
    );
    if (
      origin && !allowedOrigins.has(origin) &&
      c.req.path.startsWith("/api/v1/")
    ) {
      return c.json(
        failure(
          requestId,
          "ORIGIN_FORBIDDEN",
          "The request origin is not allowed.",
        ),
        403,
      );
    }
    if (origin && allowedOrigins.has(origin)) {
      c.header("Access-Control-Allow-Origin", origin);
      c.header("Vary", "Origin");
    }
    c.header("Access-Control-Allow-Headers", cors.allowHeaders);
    c.header("Access-Control-Allow-Methods", cors.allowMethods);
    if (c.req.method === "OPTIONS") return c.body(null, 204);
    await next();
  });

  app.use(
    "/api/v1/*",
    bodyLimit({
      maxSize: 128 * 1024,
      onError: (c) =>
        c.json(
          failure(
            c.get("requestId"),
            "PAYLOAD_TOO_LARGE",
            "The request body exceeds 128 KiB.",
          ),
          413,
        ),
    }),
  );

  app.get(
    "/api/health",
    (c) =>
      c.json(
        envelope(c.get("requestId"), {
          ok: true,
          service: "preseed-api",
          timestamp: new Date().toISOString(),
        }),
      ),
  );

  app.use("/api/v1/*", async (c, next) => {
    const requestId = c.get("requestId");
    const authorization = c.req.header("Authorization");
    if (!authorization?.match(/^Bearer\s+\S+$/i)) {
      return c.json(
        failure(requestId, "UNAUTHORIZED", "Authentication is required."),
        401,
      );
    }
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !key) {
      return c.json(
        failure(
          requestId,
          "SERVICE_UNAVAILABLE",
          "The API is temporarily unavailable.",
        ),
        503,
      );
    }
    const supabase = createClient(url, key, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authorization.replace(/^Bearer\s+/i, "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return c.json(
        failure(
          requestId,
          "UNAUTHORIZED",
          "Authentication is invalid or expired.",
        ),
        401,
      );
    }
    c.set("user", user);
    c.set("supabase", supabase);
    await next();
  });

  app.get("/api/v1/me", async (c) => {
    const { data, error } = await c.get("supabase").from("profiles").select(
      "id,display_name,avatar_url,fertility_track,onboarding_data,onboarding_completed_at,health_data_consented_at,created_at,updated_at",
    ).eq("id", c.get("user").id).single();
    if (error) throw error;
    return c.json(envelope(c.get("requestId"), data));
  });

  app.put("/api/v1/onboarding", async (c) => {
    const input = await bodyOf(c);
    const requestId = c.get("requestId");
    if (
      !isRecord(input) ||
      !allowed(
        input.fertilityTrack,
        [
          "general",
          "vasectomy_reversal",
          "pre_treatment_preservation",
        ] as const,
      ) || !isRecord(input.answers) ||
      typeof input.healthDataConsent !== "boolean" ||
      (input.complete === true && input.healthDataConsent !== true)
    ) {
      return c.json(
        failure(
          requestId,
          "INVALID_ONBOARDING",
          "Track, answers, and health-data consent are required.",
        ),
        422,
      );
    }
    const now = new Date().toISOString();
    const { data, error } = await c.get("supabase").from("profiles").update({
      fertility_track: input.fertilityTrack,
      onboarding_data: input.answers,
      health_data_consented_at: input.healthDataConsent ? now : null,
      onboarding_completed_at: input.complete === true ? now : null,
    }).eq("id", c.get("user").id).select(
      "id,fertility_track,onboarding_data,onboarding_completed_at,health_data_consented_at,updated_at",
    ).single();
    if (error) throw error;
    return c.json(envelope(requestId, data));
  });

  app.post("/api/v1/clinical-tests", async (c) => {
    const input = await bodyOf(c);
    const requestId = c.get("requestId");
    if (
      !isRecord(input) ||
      !allowed(input.testType, ["semen_analysis", "hormone_panel"] as const) ||
      !allowed(input.source, ["manual", "upload", "simulated"] as const) ||
      !asDate(input.collectedAt)
    ) {
      return c.json(
        failure(
          requestId,
          "INVALID_CLINICAL_TEST",
          "Test type, source, and collection time are required.",
        ),
        422,
      );
    }
    const row = {
      user_id: c.get("user").id,
      test_type: input.testType,
      source: input.source,
      collected_at: input.collectedAt,
      lab_name: input.labName == null ? null : asString(input.labName, 200),
      abstinence_hours: typeof input.abstinenceHours === "number" &&
          Number.isInteger(input.abstinenceHours) &&
          input.abstinenceHours >= 0 && input.abstinenceHours <= 720
        ? input.abstinenceHours
        : null,
      collection_complete: typeof input.collectionComplete === "boolean"
        ? input.collectionComplete
        : null,
      recent_fever: input.recentFever === true,
      notes: input.notes == null ? null : asString(input.notes, 2000),
    };
    const { data, error } = await c.get("supabase").from("clinical_tests")
      .insert(row).select().single();
    if (error) throw error;
    return c.json(envelope(requestId, data), 201);
  });

  app.get("/api/v1/clinical-tests", async (c) => {
    const limit = Math.min(
      Math.max(Number(c.req.query("limit")) || 20, 1),
      100,
    );
    let query = c.get("supabase").from("clinical_tests").select(
      "*,clinical_markers(*)",
    ).order("collected_at", { ascending: false }).order("id", {
      ascending: false,
    }).limit(limit);
    const before = c.req.query("before");
    if (before) {
      const separator = before.lastIndexOf("|");
      const beforeDate = separator > 0
        ? asDate(before.slice(0, separator))
        : null;
      const beforeId = separator > 0
        ? asUuid(before.slice(separator + 1))
        : null;
      if (!beforeDate || !beforeId) {
        return c.json(
          failure(
            c.get("requestId"),
            "INVALID_CURSOR",
            "The pagination cursor is invalid.",
          ),
          422,
        );
      }
      query = query.or(
        `collected_at.lt.${beforeDate},and(collected_at.eq.${beforeDate},id.lt.${beforeId})`,
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    const nextCursor = data?.length === limit
      ? `${data[data.length - 1]?.collected_at}|${data[data.length - 1]?.id}`
      : null;
    return c.json(envelope(c.get("requestId"), data, { nextCursor }));
  });

  app.get("/api/v1/clinical-tests/:id", async (c) => {
    if (!asUuid(c.req.param("id"))) {
      return c.json(
        failure(
          c.get("requestId"),
          "INVALID_ID",
          "The clinical test identifier is invalid.",
        ),
        422,
      );
    }
    const { data, error } = await c.get("supabase").from("clinical_tests")
      .select("*,clinical_markers(*)").eq("id", c.req.param("id"))
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return c.json(
        failure(
          c.get("requestId"),
          "CLINICAL_TEST_NOT_FOUND",
          "The clinical test was not found.",
        ),
        404,
      );
    }
    return c.json(envelope(c.get("requestId"), data));
  });

  app.put("/api/v1/clinical-tests/:id/markers", async (c) => {
    const input = await bodyOf(c);
    const requestId = c.get("requestId");
    if (
      !isRecord(input) || !Array.isArray(input.markers) ||
      input.markers.length === 0 || input.markers.length > 30
    ) {
      return c.json(
        failure(
          requestId,
          "INVALID_MARKERS",
          "One to thirty markers are required.",
        ),
        422,
      );
    }
    if (!asUuid(c.req.param("id"))) {
      return c.json(
        failure(
          requestId,
          "INVALID_ID",
          "The clinical test identifier is invalid.",
        ),
        422,
      );
    }
    const { data: test, error: testError } = await c.get("supabase").from(
      "clinical_tests",
    )
      .select("id,test_type").eq("id", c.req.param("id")).maybeSingle();
    if (testError) throw testError;
    if (!test) {
      return c.json(
        failure(
          requestId,
          "CLINICAL_TEST_NOT_FOUND",
          "The clinical test was not found.",
        ),
        404,
      );
    }
    const rows = [];
    for (const raw of input.markers) {
      if (
        !isRecord(raw) || !allowed(raw.code, markerCodes) ||
        typeof raw.value !== "number" || !Number.isFinite(raw.value) ||
        raw.value < 0 ||
        !asString(raw.unit, 40) ||
        !allowed(
          raw.verification ?? "user_entered",
          ["user_entered", "user_confirmed", "lab_report"] as const,
        )
      ) {
        return c.json(
          failure(
            requestId,
            "INVALID_MARKER",
            "Each marker requires a supported code, numeric value, unit, and verification.",
          ),
          422,
        );
      }
      const unit = asString(raw.unit, 40)!;
      if (
        !markerMatchesTest(
          raw.code,
          unit,
          test.test_type as ClinicalTestType,
        )
      ) {
        return c.json(
          failure(
            requestId,
            "MARKER_TEST_MISMATCH",
            "Each marker must match the clinical test type and canonical unit.",
          ),
          422,
        );
      }
      if (
        [
          "progressive_motility_pct",
          "total_motility_pct",
          "normal_morphology_pct",
          "dna_fragmentation_pct",
        ].includes(raw.code) &&
        raw.value > 100
      ) {
        return c.json(
          failure(
            requestId,
            "INVALID_MARKER",
            "Percentage markers must be between zero and one hundred.",
          ),
          422,
        );
      }
      if (
        (raw.referenceLow != null &&
          (typeof raw.referenceLow !== "number" || raw.referenceLow < 0)) ||
        (raw.referenceHigh != null &&
          (typeof raw.referenceHigh !== "number" || raw.referenceHigh < 0)) ||
        (typeof raw.referenceLow === "number" &&
          typeof raw.referenceHigh === "number" &&
          raw.referenceLow > raw.referenceHigh)
      ) {
        return c.json(
          failure(
            requestId,
            "INVALID_REFERENCE_RANGE",
            "Marker reference ranges are invalid.",
          ),
          422,
        );
      }
      rows.push({
        test_id: test.id,
        user_id: c.get("user").id,
        code: raw.code,
        numeric_value: raw.value,
        unit,
        reference_low: typeof raw.referenceLow === "number"
          ? raw.referenceLow
          : null,
        reference_high: typeof raw.referenceHigh === "number"
          ? raw.referenceHigh
          : null,
        verification: raw.verification ?? "user_entered",
      });
    }
    const { data, error } = await c.get("supabase").from("clinical_markers")
      .upsert(rows, { onConflict: "test_id,code" }).select();
    if (error) throw error;
    return c.json(envelope(requestId, data));
  });

  app.post("/api/v1/protocols", async (c) => {
    const input = await bodyOf(c);
    const requestId = c.get("requestId");
    if (
      !isRecord(input) || !asDate(input.startsOn) || !asDate(input.endsOn) ||
      !asString(input.title, 200) || !Array.isArray(input.items) ||
      input.items.length === 0 || input.items.length > 200
    ) {
      return c.json(
        failure(
          requestId,
          "INVALID_PROTOCOL",
          "Dates, title, and protocol items are required.",
        ),
        422,
      );
    }
    const durationDays =
      (Date.parse(String(input.endsOn)) - Date.parse(String(input.startsOn))) /
      86_400_000;
    if (durationDays < 0 || durationDays > 730) {
      return c.json(
        failure(
          requestId,
          "INVALID_PROTOCOL_DURATION",
          "Protocol duration must be between zero and 730 days.",
        ),
        422,
      );
    }
    const items = [];
    for (const raw of input.items) {
      if (
        !isRecord(raw) || !Number.isInteger(raw.weekNumber) ||
        Number(raw.weekNumber) < 1 || Number(raw.weekNumber) > 104 ||
        !allowed(
          raw.category,
          [
            "nutrition",
            "exercise",
            "sleep",
            "supplement",
            "exposure",
            "lifestyle",
            "clinical_navigation",
          ] as const,
        ) || !asString(raw.title, 200) || !asString(raw.description, 2000) ||
        !allowed(
          raw.evidenceStatus,
          ["evidence_backed", "general_guidance"] as const,
        ) || !Array.isArray(raw.evidenceIds)
      ) {
        return c.json(
          failure(
            requestId,
            "INVALID_PROTOCOL_ITEM",
            "Every protocol item must satisfy the closed contract.",
          ),
          422,
        );
      }
      items.push({
        week_number: raw.weekNumber,
        category: raw.category,
        title: raw.title,
        description: raw.description,
        evidence_status: raw.evidenceStatus,
        evidence_ids: raw.evidenceIds.filter((id): id is string =>
          typeof id === "string"
        ),
      });
    }
    const { data: id, error } = await c.get("supabase").rpc(
      "create_protocol_with_items",
      {
        p_starts_on: String(input.startsOn).slice(0, 10),
        p_ends_on: String(input.endsOn).slice(0, 10),
        p_title: input.title,
        p_rationale: typeof input.rationale === "string" ? input.rationale : "",
        p_items: items,
      },
    );
    if (error) throw error;
    const { data, error: readError } = await c.get("supabase").from("protocols")
      .select("*,protocol_items(*)").eq("id", id).single();
    if (readError) throw readError;
    return c.json(envelope(requestId, data), 201);
  });

  app.get("/api/v1/protocols/current", async (c) => {
    const { data, error } = await c.get("supabase").from("protocols").select(
      "*,protocol_items(*)",
    ).eq("status", "active").maybeSingle();
    if (error) throw error;
    if (!data) {
      return c.json(
        failure(
          c.get("requestId"),
          "PROTOCOL_NOT_FOUND",
          "No active protocol was found.",
        ),
        404,
      );
    }
    return c.json(envelope(c.get("requestId"), data));
  });

  app.post("/api/v1/adherence-events", async (c) => {
    const input = await bodyOf(c);
    const requestId = c.get("requestId");
    if (
      !isRecord(input) || !asUuid(input.protocolItemId) ||
      !asDate(input.occurredOn) ||
      !allowed(input.status, ["completed", "partial", "skipped"] as const)
    ) {
      return c.json(
        failure(
          requestId,
          "INVALID_ADHERENCE_EVENT",
          "Protocol item, date, and status are required.",
        ),
        422,
      );
    }
    const { data, error } = await c.get("supabase").from("adherence_events")
      .upsert({
        user_id: c.get("user").id,
        protocol_item_id: input.protocolItemId,
        occurred_on: String(input.occurredOn).slice(0, 10),
        status: input.status,
        notes: input.notes == null ? null : asString(input.notes, 1000),
      }, { onConflict: "user_id,protocol_item_id,occurred_on" }).select()
      .single();
    if (error) throw error;
    return c.json(envelope(requestId, data), 201);
  });

  app.post("/api/v1/check-ins", async (c) => {
    const input = await bodyOf(c);
    const requestId = c.get("requestId");
    if (
      !isRecord(input) ||
      (input.protocolId != null && !asUuid(input.protocolId)) ||
      (input.adherenceRating != null &&
        (!Number.isInteger(input.adherenceRating) ||
          Number(input.adherenceRating) < 1 ||
          Number(input.adherenceRating) > 5)) ||
      (input.wellbeingRating != null &&
        (!Number.isInteger(input.wellbeingRating) ||
          Number(input.wellbeingRating) < 1 ||
          Number(input.wellbeingRating) > 5))
    ) {
      return c.json(
        failure(
          requestId,
          "INVALID_CHECK_IN",
          "Ratings must be integers from one to five.",
        ),
        422,
      );
    }
    const { data, error } = await c.get("supabase").from("check_ins").insert({
      user_id: c.get("user").id,
      protocol_id: input.protocolId ?? null,
      adherence_rating: input.adherenceRating ?? null,
      wellbeing_rating: input.wellbeingRating ?? null,
      notes: input.notes == null ? null : asString(input.notes, 2000),
    }).select().single();
    if (error) throw error;
    return c.json(envelope(requestId, data), 201);
  });

  app.get("/api/v1/trends", async (c) => {
    const { data, error } = await c.get("supabase").from("clinical_tests")
      .select(
        "id,test_type,source,collected_at,abstinence_hours,collection_complete,recent_fever,clinical_markers(code,numeric_value,unit,verification)",
      ).order("collected_at", { ascending: true }).limit(100);
    if (error) throw error;
    return c.json(
      envelope(c.get("requestId"), {
        tests: data,
        interpretation:
          "Measured results only. Collection conditions and provenance must be considered before comparison.",
      }),
    );
  });

  app.notFound((c) =>
    c.json(
      failure(
        c.get("requestId") ?? crypto.randomUUID(),
        "NOT_FOUND",
        "The requested operation was not found.",
      ),
      404,
    )
  );
  app.onError((error, c) => {
    console.error(
      JSON.stringify({
        requestId: c.get("requestId"),
        operation: c.req.path,
        error: error.name,
      }),
    );
    return c.json(
      failure(
        c.get("requestId") ?? crypto.randomUUID(),
        "INTERNAL_ERROR",
        "The request could not be completed.",
      ),
      500,
    );
  });
  return app;
}
