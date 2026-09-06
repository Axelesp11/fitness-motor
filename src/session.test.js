import { describe, expect, it } from "vitest";
import {
  completeWorkout,
  createWorkoutSession,
  discardWorkoutLogs,
  sessionForWorkout,
  sessionLogsSinceLastCompletion,
  sessionProgress,
} from "./session.js";

const session = {
  label: "Día 1 · Full Body",
  template: "fullbody",
  exercises: [
    { id: "squat", name: "Sentadilla", group: "Cuadriceps", type: "compound", increment: 5, prescription: { sets: 3, min: 5, max: 8, rir: 2, rest: 180, intent: "Técnica" } },
    { id: "bench", name: "Press banca", group: "Pecho", type: "compound", increment: 2.5, prescription: { sets: 3, min: 6, max: 10, rir: 2, rest: 150, intent: "Tensión" } },
    { id: "row", name: "Remo", group: "Espalda", type: "compound", increment: 2.5, prescription: { sets: 3, min: 6, max: 10, rir: 2, rest: 150, intent: "Tensión" } },
  ],
};

function log(id, createdAt, sessionId = null) {
  return { exerciseId: id, sessionId, sessionLabel: session.label, createdAt, sets: [{ weight: 50, reps: 8, rir: 2 }] };
}

describe("sessionProgress", () => {
  it("no permite finalizar una sesión vacía", () => {
    const progress = sessionProgress(session, [], []);
    expect(progress.completed).toBe(0);
    expect(progress.canFinish).toBe(false);
    expect(progress.minimumToFinish).toBe(2);
  });

  it("cuenta ejercicios únicos, no cantidad de logs", () => {
    const logs = [
      log("squat", "2026-09-05T10:00:00Z"),
      log("squat", "2026-09-05T10:05:00Z"),
      log("bench", "2026-09-05T10:10:00Z"),
    ];
    const progress = sessionProgress(session, logs, []);
    expect(progress.completed).toBe(2);
    expect(progress.percent).toBe(67);
    expect(progress.canFinish).toBe(true);
  });

  it("usa sessionId cuando existe una sesión activa", () => {
    const active = createWorkoutSession(session, 0, () => "workout-1", new Date("2026-09-05T10:00:00Z"));
    const logs = [
      log("squat", "2026-09-05T10:05:00Z", "workout-1"),
      log("bench", "2026-09-05T10:10:00Z", "otra"),
    ];
    const progress = sessionProgress(session, logs, [], active);
    expect(progress.completed).toBe(1);
    expect(progress.active).toBe(true);
  });

  it("solo usa registros posteriores a la última finalización como fallback legacy", () => {
    const logs = [
      log("squat", "2026-09-05T10:00:00Z"),
      log("bench", "2026-09-05T12:00:00Z"),
    ];
    const completions = [{ sessionLabel: session.label, createdAt: "2026-09-05T11:00:00Z" }];
    const current = sessionLogsSinceLastCompletion(logs, completions, session.label);
    expect(current).toHaveLength(1);
    expect(current[0].exerciseId).toBe("bench");
  });
});

describe("workout snapshot", () => {
  it("congela la prescripción aunque el plan fuente cambie después", () => {
    const mutable = structuredClone(session);
    const active = createWorkoutSession(mutable, 0, () => "workout-1", new Date("2026-09-05T10:00:00Z"), {
      objective: "hipertrofia",
      week: 3,
      targetRir: "2",
      fatigueStatus: "Rendimiento estable",
    });
    mutable.exercises[0].prescription.sets = 1;
    mutable.exercises[0].prescription.rir = 5;

    const frozen = sessionForWorkout(active, mutable);
    expect(frozen.exercises[0].prescription.sets).toBe(3);
    expect(frozen.exercises[0].prescription.rir).toBe(2);
    expect(active.planContext.objective).toBe("hipertrofia");
    expect(active.planContext.week).toBe(3);
  });

  it("normaliza el label del snapshot al identificador lógico de la sesión activa", () => {
    const active = createWorkoutSession(session, 0, () => "workout-1", new Date("2026-09-05T10:00:00Z"));
    active.sessionSnapshot.label = "Label alterado";
    const resolved = sessionForWorkout(active, session);
    expect(resolved.label).toBe(session.label);
    const progress = sessionProgress(resolved, [log("squat", "2026-09-05T10:05:00Z", "workout-1")], [], active);
    expect(progress.completed).toBe(1);
  });

  it("el abandono elimina solo logs de la sesión activa", () => {
    const active = createWorkoutSession(session, 0, () => "workout-1", new Date("2026-09-05T10:00:00Z"));
    const logs = [
      log("squat", "2026-09-05T10:05:00Z", "workout-1"),
      log("bench", "2026-09-04T10:05:00Z", "workout-old"),
    ];
    const remaining = discardWorkoutLogs(logs, active);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].sessionId).toBe("workout-old");
  });
});

describe("workout entity", () => {
  it("guarda duración, porcentaje, objetivo y conteos al finalizar", () => {
    const active = createWorkoutSession(session, 0, () => "workout-1", new Date("2026-09-05T10:00:00Z"), { objective: "fuerza" });
    const progress = { canFinish: true, completed: 2, planned: 3, percent: 67 };
    const completion = completeWorkout(active, progress, new Date("2026-09-05T10:45:00Z"), () => "done-1");
    expect(completion.sessionId).toBe("workout-1");
    expect(completion.durationSec).toBe(2700);
    expect(completion.completionPct).toBe(67);
    expect(completion.completedExercises).toBe(2);
    expect(completion.objective).toBe("fuerza");
  });
});
