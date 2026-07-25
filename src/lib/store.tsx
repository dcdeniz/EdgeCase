"use client";

/**
 * Prototype state.
 *
 * Local-only. Nothing here calls the Edge API — the implemented contract has no
 * assessment, adaptation, coach or evidence-search operations, and inventing
 * them would misrepresent backend readiness. Screens that would read or write
 * real data name their operation in docs/design/screens.md.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type ClinicalTest,
  type MarkerCode,
  comparabilityIssues,
  markerCatalogue,
  semenMarkerOrder,
} from "@/lib/clinical";
import {
  categoryLabel,
  demoBaseline,
  demoHormonePanel,
  demoRetest,
  protocolTemplate,
  reversalSeries,
  type ProtocolItem,
} from "@/lib/fixtures";
import { TODAY, addDays, daysBetween } from "@/lib/format";
import type { FoodEntry } from "@/lib/nutrition";
import { defaultGoals, type Goal } from "@/lib/goals";
import {
  computeReadiness,
  type OnboardingAnswers,
  type ReadinessResult,
} from "@/lib/readiness";

export type Track = "general" | "vasectomy_reversal" | "pre_treatment_preservation";

export const trackLabel: Record<Track, string> = {
  general: "General fertility improvement",
  vasectomy_reversal: "Vasectomy-reversal tracking",
  pre_treatment_preservation: "Pre-treatment fertility preservation",
};

export const trackSummary: Record<Track, string> = {
  general:
    "A dated protocol built from your results, ending in a scheduled retest and a before-and-after comparison.",
  vasectomy_reversal:
    "Longitudinal tracking of real laboratory results at the intervals your surgeon directs, with recovery context.",
  pre_treatment_preservation:
    "Time-critical navigation to preservation before treatment begins. Not a testing or improvement plan.",
};

export type AdherenceStatus = "completed" | "partial" | "skipped";

export type CheckIn = {
  id: string;
  createdOn: string;
  adherenceRating?: number;
  wellbeingRating?: number;
  notes?: string;
};

export type ActiveProtocol = {
  id: string;
  version: number;
  title: string;
  startsOn: string;
  endsOn: string;
  days: number;
  retestDueOn: string;
  rationale: string;
  items: ProtocolItem[];
};

export type ProposedAdaptation = {
  id: string;
  reason: string;
  changes: Array<{ kind: "add" | "adjust" | "remove"; title: string; detail: string }>;
  proposedOn: string;
};

export type Settings = {
  theme: "system" | "light" | "dark";
  textScale: "default" | "large" | "larger" | "largest";
  motion: "system" | "reduced";
  contrast: "system" | "high";
};

export type PrototypeState = {
  signedIn: boolean;
  email: string | null;
  consents: { privacy: boolean; healthData: boolean; disclaimer: boolean };
  track: Track | null;
  answers: OnboardingAnswers;
  onboardingComplete: boolean;
  tests: ClinicalTest[];
  protocol: ActiveProtocol | null;
  adherence: Record<string, AdherenceStatus>;
  checkIns: CheckIn[];
  adaptation: ProposedAdaptation | null;
  settings: Settings;
  preservation: { treatmentStart: string | null; checklist: Record<string, boolean> };
  offline: boolean;
  /**
   * Meals the user confirmed, which override the synthetic log for their date.
   * These feed the diet domain, so a logged meal moves Seed Score.
   */
  foodEntries: FoodEntry[];
  /** User-set behavioural targets. Empty means none chosen yet. */
  goals: Goal[];
};

const initialState: PrototypeState = {
  signedIn: false,
  email: null,
  consents: { privacy: false, healthData: false, disclaimer: false },
  track: null,
  answers: {},
  onboardingComplete: false,
  tests: [],
  protocol: null,
  adherence: {},
  checkIns: [],
  adaptation: null,
  /*
   * Light is the default rather than system, because the warm-cream surface is
   * the intended presentation. The display settings screen changes it in both
   * directions and the choice persists, so this is a starting point, not a
   * removal of the preference.
   */
  settings: { theme: "light", textScale: "default", motion: "system", contrast: "system" },
  preservation: { treatmentStart: null, checklist: {} },
  offline: false,
  foodEntries: [],
  goals: defaultGoals,
};

const STORAGE_KEY = "preseed.prototype.v1";

/* ==========================================================================
   Protocol construction
   ========================================================================== */

export function buildProtocol(startsOn: string, days: number, version = 1): ActiveProtocol {
  const endsOn = addDays(startsOn, days - 1);
  return {
    id: `protocol-${version}`,
    version,
    title: `${days}-day protocol`,
    startsOn,
    endsOn,
    days,
    retestDueOn: addDays(startsOn, days - 2),
    rationale:
      "Built from your baseline analysis and onboarding answers. Emphasis follows the measurements that sit below their reference intervals; every dated action links back to the result it responds to.",
    items: protocolTemplate,
  };
}

export function protocolDay(protocol: ActiveProtocol, today = TODAY) {
  return Math.min(protocol.days, Math.max(1, daysBetween(protocol.startsOn, today) + 1));
}

export function protocolWeek(protocol: ActiveProtocol, today = TODAY) {
  return Math.max(1, Math.ceil(protocolDay(protocol, today) / 7));
}

export function itemsForWeek(protocol: ActiveProtocol, week: number) {
  return protocol.items.filter((item) => week >= item.weekFrom && week <= item.weekTo);
}

export function adherenceKey(itemId: string, date: string) {
  return `${itemId}|${date}`;
}

/* ==========================================================================
   Data confidence
   --------------------------------------------------------------------------
   Confidence describes the evidence base under the other outputs. Missing data
   lands here, never on readiness.
   ========================================================================== */

export type ConfidenceState = "strong" | "partial" | "weak" | "missing";

export const confidenceStateLabel: Record<ConfidenceState, string> = {
  strong: "Strong",
  partial: "Partial",
  weak: "Weak",
  missing: "Not available",
};

const confidenceStateValue: Record<ConfidenceState, number> = {
  strong: 1,
  partial: 0.6,
  weak: 0.3,
  missing: 0,
};

export type ConfidenceFactor = {
  id: string;
  label: string;
  state: ConfidenceState;
  detail: string;
  weight: number;
};

export type ConfidenceResult = {
  score: number;
  band: "low" | "moderate" | "good";
  bandLabel: string;
  factors: ConfidenceFactor[];
};

export function computeConfidence(state: PrototypeState): ConfidenceResult {
  const semen = state.tests
    .filter((test) => test.testType === "semen_analysis")
    .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt));
  const latest = semen.at(-1);
  const baseline = semen[0];
  const hormones = state.tests.find((test) => test.testType === "hormone_panel");

  const factors: ConfidenceFactor[] = [];

  factors.push(
    latest
      ? {
          id: "provenance",
          label: "Result provenance",
          state: latest.source === "simulated" ? "weak" : latest.source === "upload" ? "strong" : "partial",
          detail:
            latest.source === "simulated"
              ? "Your latest result is simulated demonstration data. Nothing derived from it describes a real person."
              : latest.source === "upload"
                ? "Your latest result came from a laboratory report."
                : "Your latest result was typed in by hand rather than read from a report.",
          weight: 25,
        }
      : {
          id: "provenance",
          label: "Result provenance",
          state: "missing",
          detail: "No clinical result has been entered.",
          weight: 25,
        },
  );

  factors.push(
    latest
      ? {
          id: "recency",
          label: "Recency",
          state:
            daysBetween(latest.collectedAt.slice(0, 10), TODAY) <= 120
              ? "strong"
              : daysBetween(latest.collectedAt.slice(0, 10), TODAY) <= 365
                ? "partial"
                : "weak",
          detail: `Collected ${daysBetween(latest.collectedAt.slice(0, 10), TODAY)} days ago. Sperm production runs on a cycle of about 64 to 74 days, so results older than a few months describe an earlier cycle.`,
          weight: 15,
        }
      : {
          id: "recency",
          label: "Recency",
          state: "missing",
          detail: "No result to date.",
          weight: 15,
        },
  );

  const measuredCodes = new Set(latest?.markers.map((marker) => marker.code) ?? []);
  const missingSemen = semenMarkerOrder.filter((code) => !measuredCodes.has(code));
  factors.push({
    id: "completeness",
    label: "Marker completeness",
    state: !latest ? "missing" : missingSemen.length === 0 ? "strong" : missingSemen.length <= 2 ? "partial" : "weak",
    detail: !latest
      ? "No markers recorded."
      : missingSemen.length === 0
        ? "Every semen marker in the catalogue has a value."
        : `Not measured: ${missingSemen.map((code) => markerCatalogue[code].label).join(", ")}.`,
    weight: 15,
  });

  factors.push({
    id: "hormones",
    label: "Hormone context",
    state: hormones ? "strong" : "missing",
    detail: hormones
      ? "A hormone panel is on file, which gives context for reading the semen result."
      : "No hormone panel. Without one, the endocrine-pattern screening output stays unavailable and the semen picture has less context.",
    weight: 10,
  });

  factors.push({
    id: "comparability",
    label: "Repeat-test comparability",
    state: !baseline || !latest || baseline === latest ? "missing" : comparabilityIssues(baseline, latest).some((issue) => issue.severity === "caution") ? "weak" : "strong",
    detail:
      !baseline || !latest || baseline === latest
        ? "Only one analysis on file, so there is nothing to compare yet."
        : comparabilityIssues(baseline, latest).length === 0
          ? "Collection conditions match closely enough for a meaningful comparison."
          : `Conditions differ: ${comparabilityIssues(baseline, latest)
              .map((issue) => issue.label.toLowerCase())
              .join(", ")}.`,
    weight: 15,
  });

  const answered = Object.values(state.answers).filter(
    (value) => value != null && (!Array.isArray(value) || value.length > 0),
  ).length;
  factors.push({
    id: "behaviour",
    label: "Behavioural log coverage",
    state: answered === 0 ? "missing" : answered >= 10 ? "partial" : "weak",
    detail:
      answered === 0
        ? "No onboarding answers recorded."
        : "Onboarding answers only. No wearable or daily-log data is connected, so behaviour is self-reported at a single point in time rather than tracked.",
    weight: 20,
  });

  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  const score = Math.round(
    (factors.reduce((sum, factor) => sum + factor.weight * confidenceStateValue[factor.state], 0) /
      totalWeight) *
      100,
  );

  const band = score < 40 ? "low" : score < 70 ? "moderate" : "good";
  return {
    score,
    band,
    bandLabel: band === "low" ? "Low confidence" : band === "moderate" ? "Moderate confidence" : "Good confidence",
    factors,
  };
}

/* ==========================================================================
   Context
   ========================================================================== */

type Store = {
  state: PrototypeState;
  update: (patch: Partial<PrototypeState>) => void;
  setAnswers: (patch: OnboardingAnswers) => void;
  setSettings: (patch: Partial<Settings>) => void;
  addTest: (test: ClinicalTest) => void;
  addFoodEntry: (entry: FoodEntry) => void;
  setGoal: (goal: Goal) => void;
  clearGoal: (id: Goal["id"]) => void;
  removeFoodEntry: (id: string) => void;
  logAdherence: (itemId: string, date: string, status: AdherenceStatus) => void;
  addCheckIn: (checkIn: Omit<CheckIn, "id" | "createdOn">) => void;
  acceptAdaptation: () => void;
  dismissAdaptation: () => void;
  seedDemo: (kind: "baseline" | "retest" | "hormones" | "reversal" | "adaptation") => void;
  reset: () => void;
  readiness: ReadinessResult;
  confidence: ConfidenceResult;
  semenTests: ClinicalTest[];
  latestSemen: ClinicalTest | undefined;
  baselineSemen: ClinicalTest | undefined;
  hormonePanel: ClinicalTest | undefined;
  belowReferenceCodes: MarkerCode[];
  ready: boolean;
};

const PrototypeContext = createContext<Store | null>(null);

export function PrototypeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PrototypeState>(initialState);
  const [ready, setReady] = useState(false);

  /**
   * Hydrate from storage after mount, so the server and the first client render
   * agree. The read is deferred to a microtask because localStorage is an
   * external system being subscribed to, not state derived during render.
   */
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...initialState, ...(JSON.parse(raw) as PrototypeState) });
      } catch {
        /* A corrupt prototype store is not worth surfacing. Start clean. */
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Storage may be unavailable in private mode. The session still works. */
    }
  }, [state, ready]);

  /* Preferences are stamped on <html> so CSS owns every visual consequence. */
  useEffect(() => {
    const root = document.documentElement;
    const { theme, textScale, motion, contrast } = state.settings;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    if (textScale === "default") root.removeAttribute("data-text-scale");
    else root.setAttribute("data-text-scale", textScale);
    if (motion === "system") root.removeAttribute("data-motion");
    else root.setAttribute("data-motion", "reduced");
    if (contrast === "system") root.removeAttribute("data-contrast");
    else root.setAttribute("data-contrast", "high");
  }, [state.settings]);

  const update = useCallback((patch: Partial<PrototypeState>) => {
    setState((previous) => ({ ...previous, ...patch }));
  }, []);

  const setAnswers = useCallback((patch: OnboardingAnswers) => {
    setState((previous) => ({ ...previous, answers: { ...previous.answers, ...patch } }));
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setState((previous) => ({ ...previous, settings: { ...previous.settings, ...patch } }));
  }, []);

  const addTest = useCallback((test: ClinicalTest) => {
    setState((previous) => {
      const tests = [...previous.tests.filter((existing) => existing.id !== test.id), test];
      const isFirstSemen =
        test.testType === "semen_analysis" &&
        !previous.tests.some((existing) => existing.testType === "semen_analysis");
      const protocol =
        previous.protocol ??
        (isFirstSemen && previous.track === "general"
          ? buildProtocol(addDays(test.collectedAt.slice(0, 10), 2), previous.answers.protocolDays ?? 100)
          : null);
      return { ...previous, tests, protocol };
    });
  }, []);

  const addFoodEntry = useCallback((entry: FoodEntry) => {
    setState((previous) => ({ ...previous, foodEntries: [...previous.foodEntries, entry] }));
  }, []);

  const setGoal = useCallback((goal: Goal) => {
    setState((previous) => ({
      ...previous,
      goals: [...previous.goals.filter((existing) => existing.id !== goal.id), goal],
    }));
  }, []);

  const clearGoal = useCallback((id: Goal["id"]) => {
    setState((previous) => ({
      ...previous,
      goals: previous.goals.filter((existing) => existing.id !== id),
    }));
  }, []);

  const removeFoodEntry = useCallback((id: string) => {
    setState((previous) => ({
      ...previous,
      foodEntries: previous.foodEntries.filter((entry) => entry.id !== id),
    }));
  }, []);

  const logAdherence = useCallback((itemId: string, date: string, status: AdherenceStatus) => {
    setState((previous) => ({
      ...previous,
      adherence: { ...previous.adherence, [adherenceKey(itemId, date)]: status },
    }));
  }, []);

  const addCheckIn = useCallback((checkIn: Omit<CheckIn, "id" | "createdOn">) => {
    setState((previous) => ({
      ...previous,
      checkIns: [
        ...previous.checkIns,
        { ...checkIn, id: `checkin-${previous.checkIns.length + 1}`, createdOn: TODAY },
      ],
    }));
  }, []);

  const acceptAdaptation = useCallback(() => {
    setState((previous) => {
      if (!previous.protocol || !previous.adaptation) return previous;
      return {
        ...previous,
        adaptation: null,
        protocol: {
          ...previous.protocol,
          version: previous.protocol.version + 1,
          id: `protocol-${previous.protocol.version + 1}`,
        },
      };
    });
  }, []);

  const dismissAdaptation = useCallback(() => {
    setState((previous) => ({ ...previous, adaptation: null }));
  }, []);

  const seedDemo = useCallback((kind: Parameters<Store["seedDemo"]>[0]) => {
    setState((previous) => {
      switch (kind) {
        case "baseline": {
          const protocol =
            previous.protocol ?? buildProtocol("2026-04-20", previous.answers.protocolDays ?? 100);
          return {
            ...previous,
            // Hormone panel ships with the baseline: FSH, LH and testosterone
            // are the endocrine context the semen result is read against.
            tests: [demoBaseline, demoHormonePanel],
            protocol,
            adherence: seedAdherence(protocol),
            /*
             * Demo answers, so parameter contributors have something of the
             * user's own to attribute to. Chosen to exercise the exposures the
             * evidence library actually covers, including one — plastics —
             * whose card is not cleared for recommendations.
             */
            answers: {
              ...previous.answers,
              smoking: "under10",
              alcoholUnits: "8to14",
              sleepHours: "6to7",
              sleepPattern: "variable",
              dietPattern: "western",
              produceServings: "under2",
              activitySessions: "1to2",
              sedentaryHours: "over8",
              heatExposure: ["prolonged_sitting", "sauna_hot_tub"],
              exposures: ["air_quality", "pesticides", "plastics"],
            },
          };
        }
        case "retest":
          return { ...previous, tests: [...previous.tests.filter((t) => t.id !== demoRetest.id), demoRetest] };
        case "hormones":
          return {
            ...previous,
            tests: [...previous.tests.filter((t) => t.id !== demoHormonePanel.id), demoHormonePanel],
          };
        case "reversal":
          return { ...previous, tests: reversalSeries, protocol: null };
        case "adaptation":
          return {
            ...previous,
            adaptation: {
              id: "adaptation-1",
              proposedOn: TODAY,
              reason:
                "Your last three check-ins recorded the fish target as partially completed, and your notes mention cost. A target you keep is worth more than a target that reads well.",
              changes: [
                {
                  kind: "adjust",
                  title: "Four fish meals a week becomes two, plus tinned oily fish twice",
                  detail: "Same dietary pattern, lower cost and less preparation. Evidence basis is unchanged.",
                },
                {
                  kind: "add",
                  title: "A weekly review of what actually got done",
                  detail: "Two minutes on Sundays, so adjustments come from what happened rather than from what was planned.",
                },
              ],
            },
          };
        default:
          return previous;
      }
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Nothing to clean up if storage is unavailable. */
    }
  }, []);

  const value = useMemo<Store>(() => {
    const semenTests = state.tests
      .filter((test) => test.testType === "semen_analysis")
      .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt));
    const latestSemen = semenTests.at(-1);
    const belowReferenceCodes = (latestSemen?.markers ?? [])
      .filter((marker) => {
        const definition = markerCatalogue[marker.code];
        const low = marker.referenceLow ?? definition.referenceLow;
        return definition.shape === "lower_limit" && low != null && marker.value < low;
      })
      .map((marker) => marker.code);

    return {
      state,
      update,
      setAnswers,
      setSettings,
      addTest,
      addFoodEntry,
      removeFoodEntry,
      setGoal,
      clearGoal,
      logAdherence,
      addCheckIn,
      acceptAdaptation,
      dismissAdaptation,
      seedDemo,
      reset,
      readiness: computeReadiness(state.answers),
      confidence: computeConfidence(state),
      semenTests,
      latestSemen,
      baselineSemen: semenTests[0],
      hormonePanel: state.tests.find((test) => test.testType === "hormone_panel"),
      belowReferenceCodes,
      ready,
    };
  }, [
    state,
    ready,
    update,
    setAnswers,
    setSettings,
    addTest,
    addFoodEntry,
    removeFoodEntry,
    setGoal,
    clearGoal,
    logAdherence,
    addCheckIn,
    acceptAdaptation,
    dismissAdaptation,
    seedDemo,
    reset,
  ]);

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  const store = useContext(PrototypeContext);
  if (!store) throw new Error("usePrototype must be used inside PrototypeProvider");
  return store;
}

/**
 * A realistic adherence history: good but imperfect, with a visible gap.
 * A perfect history would make the no-shaming design impossible to demonstrate.
 */
function seedAdherence(protocol: ActiveProtocol): Record<string, AdherenceStatus> {
  const record: Record<string, AdherenceStatus> = {};
  const dailyItems = protocol.items.filter((item) => item.cadence === "daily");
  const weeklyItems = protocol.items.filter((item) => item.cadence === "weekly");
  const total = daysBetween(protocol.startsOn, TODAY);

  for (let offset = 0; offset < total; offset += 1) {
    const date = addDays(protocol.startsOn, offset);
    const week = Math.floor(offset / 7) + 1;
    // A holiday in weeks 8 and 9 leaves a genuine gap in the record.
    const onHoliday = week === 8 || (week === 9 && offset % 7 < 3);
    for (const item of dailyItems) {
      if (week < item.weekFrom || week > item.weekTo) continue;
      if (onHoliday) {
        record[adherenceKey(item.id, date)] = offset % 3 === 0 ? "partial" : "skipped";
        continue;
      }
      const roll = (offset * 7 + item.id.length) % 10;
      record[adherenceKey(item.id, date)] = roll < 7 ? "completed" : roll < 9 ? "partial" : "skipped";
    }
    if (offset % 7 === 6) {
      for (const item of weeklyItems) {
        if (week < item.weekFrom || week > item.weekTo) continue;
        const roll = (week * 5 + item.id.length) % 10;
        record[adherenceKey(item.id, date)] = roll < 6 ? "completed" : roll < 9 ? "partial" : "skipped";
      }
    }
  }
  return record;
}

/**
 * Rolling-window adherence.
 *
 * A window percentage rather than a streak, so there is no unbroken count to
 * lose and nothing to shame. See docs/design/market-inspiration.md.
 */
export function adherenceWindow(
  state: PrototypeState,
  windowDays = 14,
  today = TODAY,
): { completed: number; partial: number; skipped: number; logged: number; percent: number | null } {
  if (!state.protocol) return { completed: 0, partial: 0, skipped: 0, logged: 0, percent: null };
  let completed = 0;
  let partial = 0;
  let skipped = 0;

  for (let offset = 0; offset < windowDays; offset += 1) {
    const date = addDays(today, -offset);
    for (const item of state.protocol.items) {
      const status = state.adherence[adherenceKey(item.id, date)];
      if (status === "completed") completed += 1;
      else if (status === "partial") partial += 1;
      else if (status === "skipped") skipped += 1;
    }
  }

  const logged = completed + partial + skipped;
  const percent = logged === 0 ? null : Math.round(((completed + partial * 0.5) / logged) * 100);
  return { completed, partial, skipped, logged, percent };
}

export { categoryLabel };
