import { describe, expect, it } from "vitest";
import { sessionLogsSinceLastCompletion, sessionProgress } from "./session.js";

const session = {
  label: "Día 1 · Full Body",
  exercises: [{ id: "squat" }, { id: "bench" }, { id: "row" }],
};

function log(id, createdAt) {
  return { exerciseId: id, sessionLabel: session.label, createdAt, sets: [{ weight: 50, reps: 8, rir: 2 }] };
}

describe("sessionProgress", () => {
  it("no permite finalizar una sesión vacía", () => {
    const progress = sessionProgress(session, [], []);
    expect(progress.completed).toBe(0);
    expect(progress.canFinish).toBe(false);
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

  it("solo usa registros posteriores a la última finalización de ese día", () => {
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
