import { describe, expect, it } from "vitest";
import {
  buildPlan,
  calcFormulaTDEE,
  calcNutrition,
  calcReadiness,
  defineSplit,
  detectPR,
  estimate1RM,
  estimateAdaptiveExpenditure,
  mesocycleState,
  nextLoadAdvice,
  warmupPlan,
  weightTrend,
} from "./engine.js";

const profile = {
  peso: 75,
  estatura: 172,
  edad: 24,
  sexo: "hombre",
  experiencia: "basico",
  objetivo: "hipertrofia",
  dias: 4,
  actividad: "sedentario",
  equipo: "gym",
  duracion: 60,
  enfoque: "balanced",
};

describe("energy model", () => {
  it("adds planned training energy separately from non-training activity", () => {
    const low = calcFormulaTDEE({ ...profile, dias: 2 });
    const high = calcFormulaTDEE({ ...profile, dias: 6 });
    expect(high).toBeGreaterThan(low);
  });

  it("moves toward observed expenditure when enough intake + weight data exist", () => {
    const logs = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, "0")}`,
      weight: 75,
      calories: 2400,
    }));
    const result = estimateAdaptiveExpenditure(profile, logs);
    expect(result.source).not.toBe("formula");
    expect(result.expenditure).toBeGreaterThan(calcFormulaTDEE(profile));
    expect(result.expenditure).toBeLessThanOrEqual(2400);
  });

  it("computes a negative weekly trend when weight is falling", () => {
    const logs = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, "0")}`,
      weight: 80 - i * 0.1,
    }));
    expect(weightTrend(logs).weeklyChangeKg).toBeLessThan(0);
  });

  it("uses a moderate goal rate to derive calorie targets", () => {
    const cut = calcNutrition({ ...profile, objetivo: "perdida" }, []);
    const gain = calcNutrition({ ...profile, objetivo: "hipertrofia" }, []);
    expect(cut.target).toBeLessThan(cut.expenditure.expenditure);
    expect(gain.target).toBeGreaterThan(gain.expenditure.expenditure);
  });
});

describe("training prescription", () => {
  it("selects the expected split", () => {
    expect(defineSplit(3).name).toBe("Full Body");
    expect(defineSplit(4).name).toBe("Upper / Lower");
    expect(defineSplit(6).sessions).toHaveLength(6);
  });

  it("forces a deload response for very poor readiness", () => {
    const readiness = calcReadiness({ energia: 1, sueno: 1, dolor: 5 });
    expect(readiness.status).toBe("deload");
    expect(readiness.setDelta).toBe(-1);
  });

  it("enters planned deload on week six", () => {
    const completions = Array.from({ length: 15 }, (_, i) => ({ id: String(i) }));
    expect(mesocycleState(completions, 3).week).toBe(6);
    expect(mesocycleState(completions, 3).isPlannedDeload).toBe(true);
  });

  it("can build a complete minimal-equipment plan", () => {
    const plan = buildPlan({ ...profile, equipo: "minimal", dias: 3 }, { energia: 4, sueno: 4, dolor: 2 }, []);
    expect(plan.sessions).toHaveLength(3);
    expect(plan.sessions.every((session) => session.exercises.length > 0)).toBe(true);
    expect(Object.values(plan.weeklyVolume).some((value) => value > 0)).toBe(true);
  });
});

describe("progression", () => {
  const plan = buildPlan(profile, { energia: 4, sueno: 4, dolor: 2 }, []);
  const exercise = plan.sessions[0].exercises.find((item) => item.loadType === "external");

  it("increases load after the top of the rep range is achieved across sets", () => {
    const log = {
      sets: Array.from({ length: exercise.prescription.sets }, () => ({
        weight: 50,
        reps: exercise.prescription.max,
        rir: exercise.prescription.rir,
      })),
    };
    expect(nextLoadAdvice(exercise, log).nextWeight).toBeGreaterThan(50);
  });

  it("reduces load when most sets miss the range at zero RIR", () => {
    const log = {
      sets: Array.from({ length: exercise.prescription.sets }, () => ({ weight: 50, reps: 2, rir: 0 })),
    };
    expect(nextLoadAdvice(exercise, log).nextWeight).toBeLessThan(50);
  });

  it("estimates 1RM and detects a new e1RM PR", () => {
    expect(estimate1RM(100, 5)).toBeCloseTo(116.7, 1);
    const previous = [{ exerciseId: "bench_press", sets: [{ weight: 80, reps: 5, rir: 2 }] }];
    const next = { exerciseId: "bench_press", sets: [{ weight: 85, reps: 5, rir: 2 }] };
    expect(detectPR(previous, next).e1rmPR).toBe(true);
  });

  it("creates ascending warm-up sets below work weight", () => {
    const warmup = warmupPlan(100, 2.5);
    expect(warmup).toHaveLength(3);
    expect(warmup[0].weight).toBeLessThan(warmup[2].weight);
    expect(warmup[2].weight).toBeLessThan(100);
  });
});
