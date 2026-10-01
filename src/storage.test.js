import { describe, expect, it } from "vitest";
import { createDefaultState, loadPreviousState, loadState, parseImportedState, PREVIOUS_STORAGE_KEY, sanitizeState, SCHEMA_VERSION } from "./storage.js";

describe("storage schema", () => {
  it("normaliza estado importado al schema actual", () => {
    const state = sanitizeState({
      profile: { edad: 10, peso: 500, dias: 9 },
      readiness: { energia: 9, sueno: 0, dolor: 3 },
    });
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(6);
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

  it("mantiene el modo elegido y distingue sesiones parciales de completas", () => {
    const state = sanitizeState({
      profile: { trainingHistory: "3to12", experiencia: "basico", learningMode: "advanced", onboardingDone: true, edad: 26, estatura: 175, peso: 80, sexo: "hombre", actividad: "ligero", objetivo: "fuerza", dias: 3, equipo: "gym", duracion: 60 },
      partialSessions: [{ id: "partial-1", sessionId: "work-1", completedExercises: 1, plannedExercises: 4 }],
    });
    expect(state.profile).toMatchObject({ trainingHistory: "3to12", learningMode: "advanced", onboardingDone: true });
    expect(state.partialSessions).toHaveLength(1);
    expect(state.sessionCompletions).toHaveLength(0);
  });

  it("pide completar el perfil antiguo si faltan datos personales, conservando las sesiones", () => {
    const state = sanitizeState({ sessionCompletions: [{ id: "done-1", sessionLabel: "Día 1" }] });
    expect(state.profile.onboardingDone).toBe(false);
    expect(state.profile.trainingHistory).toBe("unknown");
    expect(state.sessionCompletions).toHaveLength(1);
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
    expect(parsed.schemaVersion).toBe(6);
  });

  it("inicia un perfil sin respuestas ni progreso y conserva el respaldo anterior", () => {
    const old = { profile: { edad: 26, peso: 80, onboardingDone: true }, sessionCompletions: [{ id: "done-1", sessionLabel: "Día 1" }] };
    const storage = { getItem: (key) => key === PREVIOUS_STORAGE_KEY ? JSON.stringify(old) : null };
    const fresh = loadState(storage);
    expect(fresh.profile).toMatchObject({ edad: null, peso: null, estatura: null, dias: null, objetivo: null, onboardingDone: false });
    expect(fresh.sessionCompletions).toHaveLength(0);
    expect(loadPreviousState(storage).sessionCompletions).toHaveLength(1);
  });

  it("guarda los días concretos en orden de calendario", () => {
    const profile = sanitizeState({ profile: { weekDays: ["viernes", "lunes", "viernes", "miercoles"], dias: 3 } }).profile;
    expect(profile.weekDays).toEqual(["lunes", "miercoles", "viernes"]);
  });

  it("conserva sueño y calorías al importar un registro diario", () => {
    const state = parseImportedState(JSON.stringify({ bodyLogs: [{ date: "2026-09-26", weight: 98, calories: 2450, sleepHours: 7.5 }] }));
    expect(state.bodyLogs[0]).toMatchObject({ calories: 2450, sleepHours: 7.5 });
    expect(sanitizeState({ bodyLogs: [{ date: "2026-09-26", weight: 98, sleepHours: 27 }] }).bodyLogs[0].sleepHours).toBeNull();
  });

  it("rejects malformed JSON", () => {
    expect(() => parseImportedState("not-json")).toThrow();
  });
});
