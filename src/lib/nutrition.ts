/**
 * Food logging — SYNTHETIC, AND DELIBERATELY NOT A CALORIE COUNTER.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Two constraints from the design research shape this module.
 *
 * 1. Cal AI's central promise — photograph the plate, receive a number — is
 *    refused (docs/design/market-inspiration.md). The *capture* pattern is
 *    borrowed because it genuinely reduces entry friction; the *inference*
 *    pattern is not. Recognition therefore returns structured items with a
 *    stated confidence for the user to confirm or correct, and the interface
 *    says so at the moment of capture rather than in a footnote.
 *
 * 2. The evidence base supports dietary *patterns*, not single nutrients or
 *    calorie totals (docs/research/male-fertility-evidence-landscape.md). So a
 *    logged day is scored on pattern quality — produce, oily fish, wholegrains,
 *    processed meat, ultra-processed share — and never on an energy figure.
 *
 * There is no model here. Recognition is a lookup against a fixed table, seeded
 * by the frame, which is honest for a prototype and cannot hallucinate a food
 * that is not in the list.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TODAY, addDays, daysBetween } from "@/lib/format";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const mealSlotLabel: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

/**
 * Pattern groups, not nutrients. Each maps to an evidence card in the approved
 * library, which is what allows a logged meal to appear in a reasoning chain.
 */
export type FoodGroup =
  | "produce"
  | "oily_fish"
  | "wholegrain"
  | "legume_nut"
  | "olive_oil"
  | "lean_protein"
  | "dairy"
  | "processed_meat"
  | "ultra_processed"
  | "alcohol";

export const foodGroupLabel: Record<FoodGroup, string> = {
  produce: "Vegetables and fruit",
  oily_fish: "Oily fish",
  wholegrain: "Wholegrains",
  legume_nut: "Legumes and nuts",
  olive_oil: "Olive oil",
  lean_protein: "Lean protein",
  dairy: "Dairy",
  processed_meat: "Processed meat",
  ultra_processed: "Ultra-processed",
  alcohol: "Alcohol",
};

/** Direction of association, at pattern level. Never a per-meal verdict. */
export const foodGroupDirection: Record<FoodGroup, "favourable" | "neutral" | "adverse"> = {
  produce: "favourable",
  oily_fish: "favourable",
  wholegrain: "favourable",
  legume_nut: "favourable",
  olive_oil: "favourable",
  lean_protein: "neutral",
  dairy: "neutral",
  processed_meat: "adverse",
  ultra_processed: "adverse",
  alcohol: "adverse",
};

export const foodGroupEvidence: Record<FoodGroup, string[]> = {
  produce: ["diet-pattern-sr", "mediterranean-sr"],
  oily_fish: ["mediterranean-sr"],
  wholegrain: ["diet-pattern-sr"],
  legume_nut: ["mediterranean-sr"],
  olive_oil: ["mediterranean-sr"],
  lean_protein: [],
  dairy: [],
  processed_meat: ["diet-pattern-sr"],
  ultra_processed: ["diet-pattern-sr"],
  alcohol: ["alcohol-umbrella"],
};

export type FoodItem = {
  id: string;
  label: string;
  group: FoodGroup;
  /** Portions, in the ordinary sense a person uses. Not grams, not calories. */
  portions: number;
};

export type FoodEntry = {
  id: string;
  date: string;
  slot: MealSlot;
  items: FoodItem[];
  /** How the entry got here. Provenance is shown, exactly as it is for lab results. */
  capture: "camera" | "manual";
  /**
   * Recognition confidence, present only for camera captures and only before
   * the user confirms. A confirmed entry is the user's statement, not the
   * model's, so the confidence is dropped once it is committed.
   */
  confidence?: "high" | "moderate" | "low";
  confirmed: boolean;
  note?: string;
};

/* ==========================================================================
   Simulated recognition
   --------------------------------------------------------------------------
   A fixed plate table. The "camera" picks one, and reports how sure it is.
   Nothing is written to the log until the user confirms the items, because a
   misrecognised plate that silently moves a score is precisely the failure the
   correction loop exists to prevent.
   ========================================================================== */

type RecognisedPlate = {
  label: string;
  items: Array<Omit<FoodItem, "id">>;
  confidence: "high" | "moderate" | "low";
  /** What the recogniser could not determine. Shown to the user, not hidden. */
  uncertainties: string[];
};

const plateTable: RecognisedPlate[] = [
  {
    label: "Grilled salmon, greens and new potatoes",
    confidence: "high",
    items: [
      { label: "Grilled salmon fillet", group: "oily_fish", portions: 1 },
      { label: "Mixed leaves and tomato", group: "produce", portions: 1.5 },
      { label: "New potatoes", group: "wholegrain", portions: 1 },
      { label: "Olive oil dressing", group: "olive_oil", portions: 1 },
    ],
    uncertainties: [
      "Cooking fat could not be identified from the image.",
      "Portion size is estimated from plate area and may be wrong by a third.",
    ],
  },
  {
    label: "Chicken and chickpea salad",
    confidence: "high",
    items: [
      { label: "Chicken breast", group: "lean_protein", portions: 1 },
      { label: "Chickpeas", group: "legume_nut", portions: 1 },
      { label: "Salad vegetables", group: "produce", portions: 2 },
    ],
    uncertainties: ["Dressing quantity is not visible in the frame."],
  },
  {
    label: "Porridge with berries and walnuts",
    confidence: "high",
    items: [
      { label: "Oats", group: "wholegrain", portions: 1 },
      { label: "Berries", group: "produce", portions: 1 },
      { label: "Walnuts", group: "legume_nut", portions: 0.5 },
      { label: "Whole milk", group: "dairy", portions: 0.5 },
    ],
    uncertainties: ["Added sugar cannot be detected visually."],
  },
  {
    label: "Bacon sandwich on white bread",
    confidence: "moderate",
    items: [
      { label: "Bacon", group: "processed_meat", portions: 1 },
      { label: "White bread", group: "ultra_processed", portions: 2 },
    ],
    uncertainties: [
      "Bread type is a guess from crumb colour.",
      "Cannot tell whether butter or spread was used.",
    ],
  },
  {
    label: "Pasta with tomato sauce",
    confidence: "moderate",
    items: [
      { label: "Pasta", group: "wholegrain", portions: 1.5 },
      { label: "Tomato sauce", group: "produce", portions: 1 },
      { label: "Hard cheese", group: "dairy", portions: 0.5 },
    ],
    uncertainties: [
      "Cannot distinguish wholemeal from refined pasta in this image.",
      "Sauce may be shop-bought, which would change the ultra-processed share.",
    ],
  },
  {
    label: "Takeaway burger and chips",
    confidence: "low",
    items: [
      { label: "Beef burger in a bun", group: "ultra_processed", portions: 1 },
      { label: "Chips", group: "ultra_processed", portions: 1.5 },
    ],
    uncertainties: [
      "Several components are hidden inside the bun.",
      "Confidence is low. Check every item before saving this one.",
    ],
  },
  {
    label: "Lentil dahl with brown rice",
    confidence: "high",
    items: [
      { label: "Lentil dahl", group: "legume_nut", portions: 1.5 },
      { label: "Brown rice", group: "wholegrain", portions: 1 },
      { label: "Spinach", group: "produce", portions: 1 },
    ],
    uncertainties: ["Ghee or oil content cannot be estimated from the image."],
  },
];

/**
 * Stand-in for a capture. `frameSeed` would be a hash of the image; here any
 * changing value works, which keeps the demo from returning the same plate
 * every time without introducing real randomness into render paths.
 */
export function recogniseFrame(frameSeed: number): RecognisedPlate {
  return plateTable[Math.abs(frameSeed) % plateTable.length];
}

export const recognitionLimits = [
  "This reads the photograph. It does not measure anything in it.",
  "Portions are estimates from plate area, not weights.",
  "Nothing is saved to your log until you confirm the items below.",
];

export const confidenceCopy: Record<"high" | "moderate" | "low", string> = {
  high: "Most items in this frame match the reference list closely.",
  moderate: "Some items are ambiguous. Check them before saving.",
  low: "This frame is hard to read. Treat every item as a guess.",
};

/* ==========================================================================
   Pattern scoring
   --------------------------------------------------------------------------
   A 0–100 day score describing how closely a logged day resembles the dietary
   pattern the evidence supports. It scores the *log*, so an unlogged day has no
   score at all rather than a zero — the same rule the readiness engine follows,
   for the same reason: missing data must not read as bad behaviour.
   ========================================================================== */

export type DietDay = {
  date: string;
  entries: FoodEntry[];
  /** Null when nothing was logged. Never zero. */
  score: number | null;
  groups: Partial<Record<FoodGroup, number>>;
};

const groupWeight: Record<FoodGroup, number> = {
  produce: 9,
  oily_fish: 7,
  wholegrain: 5,
  legume_nut: 5,
  olive_oil: 3,
  lean_protein: 1,
  dairy: 0,
  processed_meat: -7,
  ultra_processed: -8,
  alcohol: -6,
};

export function scoreDietDay(entries: FoodEntry[]): {
  score: number | null;
  groups: Partial<Record<FoodGroup, number>>;
} {
  const confirmed = entries.filter((entry) => entry.confirmed);
  if (confirmed.length === 0) return { score: null, groups: {} };

  const groups: Partial<Record<FoodGroup, number>> = {};
  for (const entry of confirmed) {
    for (const item of entry.items) {
      groups[item.group] = (groups[item.group] ?? 0) + item.portions;
    }
  }

  /*
   * Favourable groups saturate — a fourth portion of vegetables is not worth
   * what the first was, and an unbounded sum would reward volume rather than
   * pattern. Adverse groups do not saturate as quickly, which keeps a heavy
   * ultra-processed day from hiding behind a salad.
   */
  let total = 50;
  for (const [group, portions] of Object.entries(groups) as Array<[FoodGroup, number]>) {
    const weight = groupWeight[group];
    const effective = weight >= 0 ? Math.min(portions, 3.5) : Math.min(portions, 4.5);
    total += weight * effective;
  }

  return { score: Math.max(0, Math.min(100, Math.round(total))), groups };
}

/* ==========================================================================
   Synthetic history
   ========================================================================== */

function hashSeed(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rng(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Logged days thin out the further back you go, which is what actually happens
 * to food diaries. The grid should show that honestly rather than pretending to
 * a year of perfect logging.
 */
export function dietDayFor(iso: string): DietDay {
  const random = rng(hashSeed(`diet:${iso}`));
  const daysAgo = daysBetween(iso, TODAY);
  const loggingRate = daysAgo < 30 ? 0.86 : daysAgo < 120 ? 0.62 : 0.3;

  if (random() > loggingRate) {
    return { date: iso, entries: [], score: null, groups: {} };
  }

  const mealCount = random() > 0.35 ? 3 : 2;
  const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];
  const entries: FoodEntry[] = [];

  /*
   * The pattern improves across the year alongside the wearable record. Early
   * days draw mostly from the processed end of the table, recent days mostly
   * from the Mediterranean end, with enough overlap that no week is uniform —
   * a monotonically improving diet would look synthetic, because it is.
   */
  const drift = (365 - Math.min(daysAgo, 365)) / 365;
  const favourable = [0, 1, 2, 6];
  const poor = [3, 4, 5];

  for (let index = 0; index < mealCount; index += 1) {
    const pool = random() < 0.12 + drift * 0.74 ? favourable : poor;
    const plate = plateTable[pool[Math.floor(random() * pool.length)]];
    entries.push({
      id: `${iso}-${slots[index]}`,
      date: iso,
      slot: slots[index],
      capture: random() > 0.45 ? "camera" : "manual",
      confirmed: true,
      items: plate.items.map((item, itemIndex) => ({
        ...item,
        id: `${iso}-${slots[index]}-${itemIndex}`,
      })),
    });
  }

  const { score, groups } = scoreDietDay(entries);
  return { date: iso, entries, score, groups };
}

export function dietHistory(days: number, endingOn = TODAY): DietDay[] {
  const rows: DietDay[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    rows.push(dietDayFor(addDays(endingOn, -offset)));
  }
  return rows;
}
