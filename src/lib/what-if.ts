/**
 * What-if projection.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * "How would stopping smoking change my Seed Score?" is answered by RE-RUNNING
 * THE SCORE, not by generating prose about it. A scenario overrides one input,
 * the same deterministic model recomputes, and the difference is reported.
 *
 * That matters for a reason beyond tidiness. A language model asked this
 * question would produce a confident number it had no basis for. This cannot:
 * if the model has nothing to say about a scenario, there is no scenario to
 * select, and the surface says so.
 *
 * Hard limit, inherited from every score in this product: a projection is over
 * MODIFIABLE BEHAVIOUR only. It says what the behaviour score would read if
 * the logged inputs changed. It says nothing about what a semen analysis would
 * show, because no evidence here supports that conversion.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  behaviourWindow,
  type BehaviourDomainId,
  type DomainOverrides,
} from "@/lib/behaviour-score";
import type { PrototypeState } from "@/lib/store";

export const PROJECTION_CAVEAT =
  "A projection of your behaviour score if the logged inputs changed. It does not predict a semen result, and it is not a promise.";

export type Scenario = {
  id: string;
  /** How the user would phrase it. */
  question: string;
  /** Short label for the chip. */
  label: string;
  /** Domain scores this scenario forces before recomputation. */
  overrides: DomainOverrides;
  /** Domains the change can reach. Used to explain the result. */
  touches: BehaviourDomainId[];
  /** Stated where the change acts through something the score cannot see. */
  note?: string;
};

export const scenarios: Scenario[] = [
  {
    id: "quit-smoking",
    question: "What if I stopped smoking?",
    label: "Stop smoking",
    overrides: {},
    touches: [],
    note: "Smoking is not one of the four scored domains, so your Seed Score does not move. It is the strongest association in your contributor list, which is a separate and more important surface.",
  },
  {
    id: "cut-alcohol",
    question: "What if I cut down to under 7 units a week?",
    label: "Cut alcohol",
    overrides: {},
    touches: [],
    note: "Alcohol sits in your contributors rather than in the four scored domains, so the score itself is unchanged.",
  },
  {
    id: "sleep-8h",
    question: "What if I slept eight hours a night?",
    label: "Sleep 8h",
    // Eight hours with a steady bedtime scores about 95 in the sleep model.
    overrides: { sleep: 95 },
    touches: ["sleep"],
  },
  {
    id: "mediterranean",
    question: "What if I ate a Mediterranean pattern every day?",
    label: "Mediterranean diet",
    overrides: { diet: 88 },
    touches: ["diet"],
  },
  {
    id: "walk-10k",
    question: "What if I walked 10,000 steps a day?",
    label: "10k steps",
    overrides: { activity: 95 },
    touches: ["activity"],
  },
  {
    id: "full-adherence",
    question: "What if I completed every protocol action?",
    label: "Full adherence",
    overrides: { adherence: 100 },
    touches: ["adherence"],
  },
];

export type Projection = {
  scenario: Scenario;
  current: number | null;
  projected: number | null;
  delta: number | null;
  /** Per-domain movement, for the explanation. */
  domainDeltas: Array<{ id: BehaviourDomainId; from: number | null; to: number | null }>;
};

export function project(state: PrototypeState, scenario: Scenario): Projection {
  const before = behaviourWindow(state, 7);
  const after = behaviourWindow(state, 7, undefined, scenario.overrides);

  return {
    scenario,
    current: before.score,
    projected: after.score,
    delta:
      before.score == null || after.score == null ? null : after.score - before.score,
    domainDeltas: scenario.touches.map((id) => ({
      id,
      from: before.domains[id],
      to: after.domains[id],
    })),
  };
}

/* ==========================================================================
   Domain headroom
   --------------------------------------------------------------------------
   How much Seed Score is still available in a domain, if it were taken to a
   realistic ceiling.

   Deliberately PER DOMAIN and not per protocol action. Three sleep actions do
   not each deliver their own points — they compete for the same headroom, and
   attaching a number to each would sum to a total the model cannot produce.
   Ceiling is 95 rather than 100 because a perfect week is not the target and
   promising the last five points would be a promise about someone's life
   rather than about arithmetic.
   ========================================================================== */

const DOMAIN_CEILING = 95;

export function domainHeadroom(
  state: PrototypeState,
  domain: BehaviourDomainId,
): { current: number | null; available: number } {
  const before = behaviourWindow(state, 7);
  const after = behaviourWindow(state, 7, undefined, { [domain]: DOMAIN_CEILING });
  const available =
    before.score == null || after.score == null ? 0 : Math.max(0, after.score - before.score);
  return { current: before.domains[domain], available };
}

/** Loose keyword match, so typing finds a scenario the model can actually run. */
export function matchScenario(text: string): Scenario | null {
  const query = text.toLowerCase();
  const table: Array<[string[], string]> = [
    [["smok", "cigarette", "vape", "quit"], "quit-smoking"],
    [["alcohol", "drink", "beer", "wine", "units"], "cut-alcohol"],
    [["sleep", "bed", "rest", "hours"], "sleep-8h"],
    [["diet", "eat", "food", "mediterranean", "nutrition"], "mediterranean"],
    [["step", "walk", "exercise", "active", "gym", "run"], "walk-10k"],
    [["protocol", "adherence", "plan", "stick"], "full-adherence"],
  ];
  for (const [keywords, id] of table) {
    if (keywords.some((word) => query.includes(word))) {
      return scenarios.find((scenario) => scenario.id === id) ?? null;
    }
  }
  return null;
}
