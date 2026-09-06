import { calculateWeeklyVolume } from "./engine.js";
import { analyzePerformanceTrend } from "./progression.js";

export function assessProgramFatigue(logs = []) {
  const recentIds = [];
  const seen = new Set();
  [...logs]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .forEach((log) => {
      if (!log?.exerciseId || seen.has(log.exerciseId)) return;
      seen.add(log.exerciseId);
      recentIds.push(log.exerciseId);
    });

  const tracked = recentIds.slice(0, 8).map((exerciseId) => ({
    exerciseId,
    trend: analyzePerformanceTrend(logs, exerciseId),
  })).filter((item) => item.trend.exposures >= 2);

  const regressions = tracked.filter((item) => item.trend.status === "regression");
  const improving = tracked.filter((item) => item.trend.status === "improving");
  const stable = tracked.filter((item) => item.trend.status === "stable");

  if (tracked.length >= 2 && regressions.length >= 2) {
    return {
      status: "regression",
      label: "Fatiga objetiva",
      message: `${regressions.length} ejercicios muestran caída repetida. El motor reduce una serie y añade 1 RIR temporalmente.`,
      setDelta: -1,
      rirDelta: 1,
      tracked: tracked.length,
      regressions: regressions.length,
      improving: improving.length,
      stable: stable.length,
    };
  }

  if (regressions.length === 1) {
    return {
      status: "caution",
      label: "Vigilar rendimiento",
      message: "Hay una regresión aislada. No se modifica todavía todo el programa; se espera otra señal antes de intervenir.",
      setDelta: 0,
      rirDelta: 0,
      tracked: tracked.length,
      regressions: 1,
      improving: improving.length,
      stable: stable.length,
    };
  }

  if (tracked.length >= 2 && improving.length >= Math.ceil(tracked.length / 2)) {
    return {
      status: "improving",
      label: "Rendimiento en alza",
      message: "La mayoría de los ejercicios rastreados mantienen o mejoran rendimiento. No se añade fatiga artificial.",
      setDelta: 0,
      rirDelta: 0,
      tracked: tracked.length,
      regressions: 0,
      improving: improving.length,
      stable: stable.length,
    };
  }

  return {
    status: tracked.length ? "stable" : "insufficient",
    label: tracked.length ? "Rendimiento estable" : "Faltan exposiciones",
    message: tracked.length
      ? "No hay evidencia suficiente de una caída sistémica del rendimiento."
      : "Registra varias exposiciones de los mismos ejercicios para activar la fatiga objetiva.",
    setDelta: 0,
    rirDelta: 0,
    tracked: tracked.length,
    regressions: regressions.length,
    improving: improving.length,
    stable: stable.length,
  };
}

export function applyProgramFatigue(plan, fatigue) {
  if (!plan?.sessions?.length || fatigue?.status !== "regression" || plan.mesocycle?.isPlannedDeload) {
    return withRirMetadata(plan, fatigue);
  }

  const sessions = plan.sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((item) => ({
      ...item,
      prescription: {
        ...item.prescription,
        sets: Math.max(1, Number(item.prescription?.sets || 1) + fatigue.setDelta),
        rir: Math.min(5, Math.max(1, Number(item.prescription?.rir || 2) + fatigue.rirDelta)),
      },
    })),
  }));

  return withRirMetadata({
    ...plan,
    sessions,
    weeklyVolume: calculateWeeklyVolume(sessions),
  }, fatigue);
}

export function withRirMetadata(plan, fatigue) {
  if (!plan) return plan;
  const rirs = (plan.sessions ?? []).flatMap((session) => session.exercises.map((item) => Number(item.prescription?.rir))).filter(Number.isFinite);
  const minRir = rirs.length ? Math.min(...rirs) : Number(plan.mesocycle?.targetRir || 2);
  const maxRir = rirs.length ? Math.max(...rirs) : minRir;
  return {
    ...plan,
    programming: {
      ...(plan.programming ?? {}),
      targetRir: minRir === maxRir ? String(minRir) : `${minRir}–${maxRir}`,
      performanceFatigue: fatigue ?? null,
    },
  };
}
