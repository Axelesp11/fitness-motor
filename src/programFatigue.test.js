import { describe, expect, it } from "vitest";
import { applyProgramFatigue, assessProgramFatigue } from "./programFatigue.js";

function log(exerciseId, day, weight) {
  return {
    id: `${exerciseId}-${day}`,
    exerciseId,
    exerciseName: exerciseId,
    sessionLabel: "Día",
    createdAt: `2026-09-0${day}T10:00:00Z`,
    sets: [{ weight, reps: 5, rir: 2 }],
  };
}

describe("assessProgramFatigue", () => {
  it("no declara fatiga sistémica por una sola regresión", () => {
    const logs = [
      log("bench", 1, 100), log("bench", 2, 95), log("bench", 3, 90),
      log("row", 1, 80), log("row", 2, 80), log("row", 3, 82.5),
    ];
    const result = assessProgramFatigue(logs);
    expect(result.status).toBe("caution");
    expect(result.setDelta).toBe(0);
  });

  it("reduce volumen solo cuando al menos dos ejercicios caen repetidamente", () => {
    const logs = [
      log("bench", 1, 100), log("bench", 2, 95), log("bench", 3, 90),
      log("squat", 1, 140), log("squat", 2, 132.5), log("squat", 3, 125),
    ];
    const result = assessProgramFatigue(logs);
    expect(result.status).toBe("regression");
    expect(result.setDelta).toBe(-1);
    expect(result.rirDelta).toBe(1);
  });
});

describe("applyProgramFatigue", () => {
  it("ajusta series, RIR y volumen semanal de forma coherente", () => {
    const plan = {
      mesocycle: { isPlannedDeload: false, targetRir: 2 },
      programming: {},
      sessions: [{
        label: "Día 1",
        exercises: [{ id: "bench", group: "Pecho", secondary: [], prescription: { sets: 3, rir: 2 } }],
      }],
      weeklyVolume: { Pecho: 3 },
    };
    const next = applyProgramFatigue(plan, { status: "regression", setDelta: -1, rirDelta: 1 });
    expect(next.sessions[0].exercises[0].prescription.sets).toBe(2);
    expect(next.sessions[0].exercises[0].prescription.rir).toBe(3);
    expect(next.weeklyVolume.Pecho).toBe(2);
    expect(next.programming.targetRir).toBe("3");
  });
});
