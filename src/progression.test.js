import { describe, expect, it } from "vitest";
import { analyzePerformanceTrend, nextProgressionAdvice } from "./progression.js";

function log(exerciseId, createdAt, weight, reps, rir = 2, sets = 3) {
  return {
    id: `${exerciseId}-${createdAt}`,
    exerciseId,
    exerciseName: exerciseId,
    sessionLabel: "Día 1",
    createdAt,
    sets: Array.from({ length: sets }, () => ({ weight, reps, rir })),
  };
}

function exercise(overrides = {}) {
  return {
    id: "bench_press",
    name: "Press banca",
    type: "compound",
    loadType: "external",
    increment: 2.5,
    prescription: { sets: 3, min: 6, max: 10, rir: 2, rest: 150 },
    ...overrides,
  };
}

describe("analyzePerformanceTrend", () => {
  it("no castiga una única sesión peor", () => {
    const logs = [
      log("bench_press", "2026-09-01T10:00:00Z", 80, 8, 2),
      log("bench_press", "2026-09-03T10:00:00Z", 80, 7, 2),
    ];
    expect(analyzePerformanceTrend(logs, "bench_press").status).not.toBe("regression");
  });

  it("detecta una caída repetida en tres exposiciones", () => {
    const logs = [
      log("bench_press", "2026-09-01T10:00:00Z", 100, 8, 2),
      log("bench_press", "2026-09-03T10:00:00Z", 95, 7, 1),
      log("bench_press", "2026-09-05T10:00:00Z", 90, 6, 0),
    ];
    const trend = analyzePerformanceTrend(logs, "bench_press");
    expect(trend.status).toBe("regression");
    expect(trend.exposures).toBe(3);
    expect(trend.deltaPct).toBeLessThan(-2.5);
  });
});

describe("nextProgressionAdvice", () => {
  it("hipertrofia usa doble progresión y sube al dominar el techo", () => {
    const item = exercise();
    const logs = [log(item.id, "2026-09-01T10:00:00Z", 80, 10, 2)];
    const advice = nextProgressionAdvice(item, logs, { objetivo: "hipertrofia" });
    expect(advice.strategy).toBe("load");
    expect(advice.nextWeight).toBe(82.5);
  });

  it("fuerza mantiene carga cuando aún no domina el rango", () => {
    const item = exercise({ prescription: { sets: 3, min: 3, max: 6, rir: 2, rest: 240 } });
    const logs = [log(item.id, "2026-09-01T10:00:00Z", 100, 4, 2)];
    const advice = nextProgressionAdvice(item, logs, { objetivo: "fuerza" });
    expect(advice.strategy).toBe("hold");
    expect(advice.nextWeight).toBe(100);
  });

  it("PR secundario no persigue carga aunque llegue al techo", () => {
    const item = exercise({
      prRole: "secondary",
      prescription: { sets: 3, min: 3, max: 5, rir: 3, rest: 240 },
    });
    const logs = [log(item.id, "2026-09-01T10:00:00Z", 90, 5, 3)];
    const advice = nextProgressionAdvice(item, logs, { objetivo: "pr" });
    expect(advice.strategy).toBe("hold");
    expect(advice.action).toMatch(/técnica/i);
  });

  it("potencia exige todas las series en techo antes de subir", () => {
    const item = exercise({ prescription: { sets: 3, min: 2, max: 5, rir: 4, rest: 210 } });
    const mixed = {
      ...log(item.id, "2026-09-01T10:00:00Z", 60, 5, 4),
      sets: [
        { weight: 60, reps: 5, rir: 4 },
        { weight: 60, reps: 5, rir: 4 },
        { weight: 60, reps: 4, rir: 4 },
      ],
    };
    expect(nextProgressionAdvice(item, [mixed], { objetivo: "potencia" }).strategy).toBe("hold");
  });

  it("pérdida de grasa no reduce por una mala sesión aislada", () => {
    const item = exercise({ prescription: { sets: 2, min: 5, max: 10, rir: 2, rest: 150 } });
    const logs = [
      log(item.id, "2026-09-01T10:00:00Z", 80, 8, 2, 2),
      log(item.id, "2026-09-03T10:00:00Z", 80, 4, 0, 2),
    ];
    const advice = nextProgressionAdvice(item, logs, { objetivo: "perdida" });
    expect(advice.strategy).toBe("hold");
    expect(advice.nextWeight).toBe(80);
  });

  it("reduce carga cuando regresión repetida coincide con fallo de rango", () => {
    const item = exercise();
    const logs = [
      log(item.id, "2026-09-01T10:00:00Z", 100, 8, 2),
      log(item.id, "2026-09-03T10:00:00Z", 95, 5, 0),
      log(item.id, "2026-09-05T10:00:00Z", 90, 4, 0),
    ];
    const advice = nextProgressionAdvice(item, logs, { objetivo: "hipertrofia" });
    expect(advice.strategy).toBe("recover");
    expect(advice.nextWeight).toBe(87.5);
    expect(advice.status).toBe("regression");
  });
});
