import { describe, expect, it } from "vitest";
import { createDefaultState, parseImportedState, sanitizeState, SCHEMA_VERSION } from "./storage.js";

describe("storage schema", () => {
  it("normaliza estado importado al schema actual", () => {
    const state = sanitizeState({
      profile: { edad: 10, peso: 500, dias: 9 },
      readiness: { energia: 9, sueno: 0, dolor: 3 },
    });
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(5);
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

  it("preserva sesión activa, snapshot, contexto, sessionId y sustituciones", () => {
    const state = sanitizeState({
      activeWorkout: {
        id: "workout-1",
        sessionLabel: "Día 1",
        sessionIndex: 1,
        startedAt: "2026-09-05T10:00:00Z",
        plannedExerciseIds: ["bench", "row"],
        sessionSnapshot: {
          label: "Día 1",
          template: "upper",
          exercises: [{
            id: "bench",
            name: "Press banca",
            group: "Pecho",
            type: "compound",
            increment: 2.5,
            prescription: { sets: 4, min: 4, max: 6, rir: 2, rest: 240, intent: "Fuerza" },
          }],
        },
        planContext: { objective: "fuerza", week: 3, targetRir: "2", fatigueStatus: "Estable" },
      },
      exerciseSubstitutions: { "Día 1:bench": "incline" },
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
    expect(state.activeWorkout.sessionSnapshot.exercises[0].prescription.sets).toBe(4);
    expect(state.activeWorkout.planContext.objective).toBe("fuerza");
    expect(state.activeWorkout.planContext.week).toBe(3);
    expect(state.exerciseLogs[0].sessionId).toBe("workout-1");
    expect(state.exerciseSubstitutions["Día 1:bench"]).toBe("incline");
  });

  it("mantiene compatibilidad con una sesión activa v4 sin snapshot", () => {
    const state = sanitizeState({
      activeWorkout: {
        id: "legacy-active",
        sessionLabel: "Día 2",
        sessionIndex: 1,
        startedAt: "2026-09-05T10:00:00Z",
        plannedExerciseIds: ["row"],
      },
    });
    expect(state.activeWorkout.id).toBe("legacy-active");
    expect(state.activeWorkout.sessionSnapshot).toBeNull();
  });

  it("round trips a valid backup", () => {
    const initial = createDefaultState();
    const parsed = parseImportedState(JSON.stringify(initial));
    expect(parsed.profile).toEqual(initial.profile);
    expect(parsed.schemaVersion).toBe(5);
  });

  it("rejects malformed JSON", () => {
    expect(() => parseImportedState("not-json")).toThrow();
  });
});
