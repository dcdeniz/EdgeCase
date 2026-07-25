import { assertEquals, assertGreater } from "@std/assert";
import {
  assessReadiness,
  type ReadinessInput,
  validateReadinessInput,
} from "./readiness.ts";
import registry from "../../../docs/research/evidence-registry.v0.1.0.json" with {
  type: "json",
};

const baseline: ReadinessInput = {
  sleep: { averageHours: 5.5, regularityMinutes: 120 },
  substances: {
    smokingStatus: "current",
    alcoholUnitsPerWeek: 24,
    bingeEpisodes30Days: 4,
    cannabisDays30: 0,
  },
  diet: {
    plantVarietyPerWeek: 8,
    fruitVegetableServingsPerDay: 2,
    fishMealsPerWeek: 0,
    processedMeatMealsPerWeek: 5,
    sugaryDrinksPerWeek: 7,
  },
  activity: {
    moderateMinutesPerWeek: 75,
    sedentaryHoursPerDay: 11,
    extremeTrainingDays30: 0,
  },
  heat: {
    saunaHotTubSessions30Days: 8,
    occupationalHeatDays30: 0,
    laptopOnLapHoursPerWeek: 8,
  },
  reproductiveHealth: {
    baselineTestStatus: "scheduled",
    ejaculationDaysPerWeek: 1,
    sexualFunctionConcern: false,
  },
  environment: {
    heatedPlasticMealsPerWeek: 6,
    plasticDrinkContainersPerDay: 3,
    occupationalExposureDays30: 0,
    ppeUsedConsistently: false,
  },
  clinicalFlags: {
    exogenousTestosterone: false,
    anabolicSteroidsOrSarms: false,
    chemotherapyOrRadiotherapy: false,
    testicularOrObstructionConcern: false,
  },
};

Deno.test("readiness produces a bounded explainable baseline", () => {
  const assessment = assessReadiness(baseline);
  assertEquals(assessment.score, 40);
  assertEquals(assessment.confidence, 100);
  assertEquals(assessment.change, null);
  assertEquals(assessment.factors.length, 21);
  assertEquals(assessment.domains.length, 7);
});

Deno.test("later comparable data produces a separate change ledger", () => {
  const first = assessReadiness(baseline);
  const improved: ReadinessInput = {
    ...baseline,
    sleep: { averageHours: 7.5, regularityMinutes: 45 },
    activity: {
      moderateMinutesPerWeek: 170,
      sedentaryHoursPerDay: 8,
      extremeTrainingDays30: 0,
    },
  };
  const second = assessReadiness(improved, first);
  assertEquals(second.change?.comparable, true);
  assertGreater(second.score, first.score);
  assertEquals(second.change?.delta, second.score - first.score);
  assertGreater(second.change?.entries.length ?? 0, 0);
});

Deno.test("new data coverage is not presented as behavioural improvement", () => {
  const first = assessReadiness({ sleep: baseline.sleep });
  const second = assessReadiness(
    { sleep: baseline.sleep, activity: baseline.activity },
    first,
  );
  assertEquals(second.change?.comparable, false);
  assertEquals(second.change?.delta, null);
  assertEquals(second.change?.reason, "INPUT_COVERAGE_CHANGED");
});

Deno.test("clinical gates never reduce or increase readiness points", () => {
  const withoutFlag = assessReadiness({
    sleep: baseline.sleep,
    clinicalFlags: {
      exogenousTestosterone: false,
      anabolicSteroidsOrSarms: false,
      chemotherapyOrRadiotherapy: false,
      testicularOrObstructionConcern: false,
    },
  });
  const withFlag = assessReadiness({
    sleep: baseline.sleep,
    clinicalFlags: {
      exogenousTestosterone: true,
      anabolicSteroidsOrSarms: false,
      chemotherapyOrRadiotherapy: false,
      testicularOrObstructionConcern: false,
    },
  });
  assertEquals(withFlag.score, withoutFlag.score);
  assertEquals(withFlag.clinicalGates[0]?.gateId, "exogenous_testosterone");
});

Deno.test("validation rejects unsupported and impossible values", () => {
  const errors = validateReadinessInput({
    sleep: {
      averageHours: 28,
      regularityMinutes: 30,
      wearableSpermCount: 100,
    },
  });
  assertEquals(
    errors.includes("inputs.sleep.wearableSpermCount is not supported"),
    true,
  );
  assertEquals(
    errors.includes("inputs.sleep.averageHours must be a number from 0 to 24"),
    true,
  );
});

Deno.test("scored evidence IDs exist in the allow-listed registry", () => {
  const assessment = assessReadiness(baseline);
  const allowedIds = new Set(registry.claims.map((claim) => claim.id));
  for (const factor of assessment.factors) {
    for (const evidenceId of factor.evidenceIds) {
      assertEquals(allowedIds.has(evidenceId), true);
    }
    if (
      factor.evidenceLevel !== "clinical_navigation" &&
      factor.evidenceLevel !== "general_guidance"
    ) {
      assertGreater(factor.evidenceIds.length, 0);
    }
  }
});
