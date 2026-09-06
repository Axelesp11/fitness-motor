import { describe, expect, it } from "vitest";
import { buildPlan } from "./engine.js";
import { adaptTrainingPlan, splitRationale } from "./programming.js";

const baseProfile = {
  peso: 80,
  estatura: 175,
  edad: 30,
  sexo: "hombre",
  experiencia: "intermedio",
  objetivo: "hipertrofia",
  dias: 4,
  actividad: "ligero",
  equipo: "gym",
  duracion: 60,
  enfoque: "balanced",
  prLift: "bench_press",
};

const readiness = { energia: 4, sueno: 4, dolor: 2 };

function planFor(overrides = {}) {
  const profile = { ...baseProfile, ...overrides };
  return adaptTrainingPlan(buildPlan(profile, readiness, []), profile);
}

function firstCompound(plan) {
  return plan.sessions.flatMap((session) => session.exercises).find((item) => item.type === "compound");
}

describe("goal-specific programming", () => {
  it("programs hypertrophy with moderate reps and multiple sets", () => {
    const plan = planFor({ objetivo: "hipertrofia" });
    const exercise = firstCompound(plan);
    expect(exercise.prescription.min).toBe(6);
    expect(exercise.prescription.max).toBe(10);
    expect(exercise.prescription.sets).toBeGreaterThanOrEqual(3);
    expect(plan.programming.evidence).toContain("ACSM 2026");
  });

  it("programs strength with low reps and long rests", () => {
    const plan = planFor({ objetivo: "fuerza" });
    const exercise = firstCompound(plan);
    expect(exercise.prescription.max).toBeLessThanOrEqual(6);
    expect(exercise.prescription.rest).toBeGreaterThanOrEqual(180);
  });

  it("injects the selected PR lift for two compatible exposures", () => {
    const plan = planFor({ objetivo: "pr", dias: 4, prLift: "bench_press" });
    const bench = plan.sessions.flatMap((session) => session.exercises).filter((item) => item.id === "bench_press");
    expect(bench.length).toBeGreaterThanOrEqual(2);
    expect(bench.some((item) => item.prRole === "primary")).toBe(true);
    expect(bench.find((item) => item.prRole === "primary").prescription.max).toBeLessThanOrEqual(4);
    expect(bench.find((item) => item.prRole === "primary").prescription.rest).toBeGreaterThanOrEqual(240);
  });

  it("does not pretend a barbell PR is available with minimal equipment", () => {
    const plan = planFor({ objetivo: "pr", equipo: "minimal", prLift: "back_squat" });
    expect(plan.programming.warning).toMatch(/requiere gimnasio/i);
  });

  it("programs power with low reps, high RIR and explosive intent", () => {
    const plan = planFor({ objetivo: "potencia" });
    const exercise = firstCompound(plan);
    expect(exercise.prescription.max).toBeLessThanOrEqual(5);
    expect(exercise.prescription.rir).toBeGreaterThanOrEqual(3);
    expect(exercise.prescription.intent).toMatch(/explosiva/i);
  });

  it("programs muscular endurance with high reps and short rest", () => {
    const plan = planFor({ objetivo: "resistencia" });
    const exercise = firstCompound(plan);
    expect(exercise.prescription.min).toBeGreaterThanOrEqual(12);
    expect(exercise.prescription.rest).toBeLessThanOrEqual(90);
  });

  it("keeps fat-loss training in a muscle-preserving rep range", () => {
    const plan = planFor({ objetivo: "perdida" });
    const exercise = firstCompound(plan);
    expect(exercise.prescription.min).toBeLessThanOrEqual(6);
    expect(exercise.prescription.max).toBeLessThanOrEqual(10);
    expect(plan.programming.summary).toMatch(/conservar|mantiene/i);
  });
});

describe("split rationale", () => {
  it("treats PPL as distribution rather than a physiological goal", () => {
    expect(splitRationale(6, "hipertrofia")).toMatch(/PPL/i);
    expect(splitRationale(4, "fuerza")).toMatch(/Upper\/Lower/i);
    expect(splitRationale(3, "hipertrofia")).toMatch(/Full Body/i);
  });
});
