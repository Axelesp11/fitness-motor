import { describe, expect, it } from "vitest";
import {
  completeWorkout,
  createWorkoutSession,
  sessionLogsSinceLastCompletion,
  sessionProgress,
} from "./session.js";

const session = {
  label: "Día 1 · Full Body",
  exercises: [{ id: "squat" }, { id: "bench" }, { id: "row" }],
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

describe("workout entity", () => {
  it("guarda duración, porcentaje y conteos al finalizar", () => {
    const active = createWorkoutSession(session, 0, () => "workout-1", new Date("2026-09-05T10:00:00Z"));
    const progress = { canFinish: true, completed: 2, planned: 3, percent: 67 };
    const completion = completeWorkout(active, progress, new Date("2026-09-05T10:45:00Z"), () => "done-1");
    expect(completion.sessionId).toBe("workout-1");
    expect(completion.durationSec).toBe(2700);
    expect(completion.completionPct).toBe(67);
    expect(completion.completedExercises).toBe(2);
  });
});
