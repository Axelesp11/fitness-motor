import { describe, expect, it } from "vitest";
import { createDefaultState, parseImportedState, sanitizeState, SCHEMA_VERSION } from "./storage.js";

describe("storage schema", () => {
  it("normaliza estado importado al schema actual", () => {
    const state = sanitizeState({
      profile: { edad: 10, peso: 500, dias: 9 },
      readiness: { energia: 9, sueno: 0, dolor: 3 },
    });
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(4);
    expect(state.profile.edad).toBe(18);
    expect(state.profile.peso).toBe(250);
    expect(state.profile.dias).toBe(6);
    expect(state.readiness.energia).toBe(5);
  });

  it("persiste objetivos expandidos y PR lift", () => {
    const state = sanitizeState({
      profile: { objetivo: "pr", prLift: "deadlift", dias: 4 },
    });
    expect(state.profile.objetivo).toBe("pr");
    expect(state.profile.prLift).toBe("deadlift");
  });

  it("preserva sesión activa, sessionId y sustituciones", () => {
    const state = sanitizeState({
      activeWorkout: {
        id: "workout-1",
        sessionLabel: "Día 1",
        sessionIndex: 1,
        startedAt: "2026-09-05T10:00:00Z",
        plannedExerciseIds: ["bench", "row"],
      },
      exerciseSubstitutions: { "upper:bench": "incline" },
      exerciseLogs: [{
        id: "log-1",
        sessionId: "workout-1",
        sessionLabel: "Día 1",
        exerciseId: "bench",
        exerciseName: "Press banca",
        createdAt: "2026-09-05T10:05:00Z",
        sets: [{ weight: 80, reps: 8, rir: 2 }],
      }],
    });
    expect(state.activeWorkout.id).toBe("workout-1");
    expect(state.activeWorkout.sessionIndex).toBe(1);
    expect(state.exerciseLogs[0].sessionId).toBe("workout-1");
    expect(state.exerciseSubstitutions["upper:bench"]).toBe("incline");
  });

  it("round trips a valid backup", () => {
    const initial = createDefaultState();
    const parsed = parseImportedState(JSON.stringify(initial));
    expect(parsed.profile).toEqual(initial.profile);
    expect(parsed.schemaVersion).toBe(4);
  });

  it("rejects malformed JSON", () => {
    expect(() => parseImportedState("not-json")).toThrow();
  });
});
