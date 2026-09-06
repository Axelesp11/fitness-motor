import { summarizeExerciseLog } from "./engine.js";

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function roundToIncrement(value, increment) {
  if (!increment) return round(value, 1);
  return round(Math.round(value / increment) * increment, 2);
}

function normalizedSets(log) {
  return (log?.sets ?? [])
    .map((set) => ({
      weight: Math.max(0, Number(set?.weight) || 0),
      reps: Math.max(0, Math.round(Number(set?.reps) || 0)),
      rir: Math.max(0, Math.min(8, Math.round(Number(set?.rir) || 0))),
    }))
    .filter((set) => set.reps > 0);
}

export function exerciseHistory(logs = [], exerciseId, limit = 4) {
  return logs
    .filter((log) => log?.exerciseId === exerciseId && Array.isArray(log?.sets) && log.sets.length)
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    .slice(-limit);
}

export function analyzePerformanceTrend(logs = [], exerciseId) {
  const history = exerciseHistory(logs, exerciseId, 3);
  if (!history.length) {
    return { status: "new", exposures: 0, deltaPct: null, metric: null, label: "Sin tendencia" };
  }

  const summaries = history.map((log) => summarizeExerciseLog(log));
  const useE1rm = summaries.every((item) => item.bestE1RM != null && item.bestE1RM > 0);
  const scores = summaries.map((item) => useE1rm ? item.bestE1RM : item.avgReps);
  const metric = useE1rm ? "e1rm" : "reps";

  if (scores.length < 2 || !scores[0]) {
    return { status: "stable", exposures: scores.length, deltaPct: null, metric, label: "Estable" };
  }

  const deltaPct = round(((scores.at(-1) - scores[0]) / scores[0]) * 100, 1);
  const declineThreshold = metric === "e1rm" ? 0.985 : null;
  let consecutiveDeclines = 0;
  for (let index = 1; index < scores.length; index += 1) {
    const declined = metric === "e1rm"
      ? scores[index] < scores[index - 1] * declineThreshold
      : scores[index] <= scores[index - 1] - 0.5;
    if (declined) consecutiveDeclines += 1;
  }

  // No se etiqueta regresión por una sola sesión mala: exige tres exposiciones
  // y dos caídas consecutivas/claras.
  if (scores.length >= 3 && consecutiveDeclines >= 2 && deltaPct <= -2.5) {
    return {
      status: "regression",
      exposures: scores.length,
      deltaPct,
      metric,
      label: `Rendimiento ${deltaPct}%`,
    };
  }

  if (deltaPct >= 2) {
    return {
      status: "improving",
      exposures: scores.length,
      deltaPct,
      metric,
      label: `Progreso +${deltaPct}%`,
    };
  }

  return { status: "stable", exposures: scores.length, deltaPct, metric, label: "Estable" };
}

function adjustment(referenceWeight, increment, direction) {
  if (!referenceWeight) return null;
  return Math.max(0, roundToIncrement(referenceWeight + increment * direction, increment));
}

function bodyweightAdvice(goal, topRangeHits, underRangeHits, majority, trend, referenceWeight) {
  if (trend.status === "regression" && underRangeHits >= majority) {
    return {
      nextWeight: referenceWeight || null,
      status: "regression",
      badge: "↓ Fatiga objetiva",
      strategy: "recover",
      action: "Reduce la dificultad una sesión y recupera técnica, reps y RIR antes de progresar.",
      trend,
    };
  }

  if (topRangeHits >= majority) {
    const message = goal === "resistencia"
      ? "Aumenta reps o densidad; después usa una variante más difícil."
      : goal === "potencia"
        ? "Haz la variante un poco más difícil solo si mantienes ejecución explosiva."
        : "Sube dificultad con reps, tempo, banda o lastre manteniendo el RIR objetivo.";
    return { nextWeight: referenceWeight || null, status: "progress", badge: "↑ Progresar", strategy: "progress", action: message, trend };
  }

  return {
    nextWeight: referenceWeight || null,
    status: trend.status === "regression" ? "caution" : "hold",
    badge: trend.status === "regression" ? "↔ Protege rendimiento" : "↔ Mantener",
    strategy: "hold",
    action: "Mantén la variante y mejora una repetición o la calidad de ejecución.",
    trend,
  };
}

export function nextProgressionAdvice(exerciseItem, logs = [], profile = {}) {
  const goal = profile.objetivo || "hipertrofia";
  const p = exerciseItem?.prescription ?? { min: 8, max: 12, rir: 2 };
  const history = exerciseHistory(logs, exerciseItem?.id, 4);
  const previousLog = history.at(-1);
  const trend = analyzePerformanceTrend(logs, exerciseItem?.id);

  if (!previousLog) {
    return {
      nextWeight: null,
      status: "new",
      badge: "Primera exposición",
      strategy: "calibrate",
      action: "Usa una carga cómoda, deja el RIR indicado y calibra desde ahí.",
      trend,
    };
  }

  const sets = normalizedSets(previousLog);
  if (!sets.length) {
    return {
      nextWeight: null,
      status: "new",
      badge: "Sin datos",
      strategy: "calibrate",
      action: "Completa al menos una serie para activar la progresión.",
      trend,
    };
  }

  const weightedSets = sets.filter((set) => set.weight > 0);
  const referenceWeight = weightedSets.length ? median(weightedSets.map((set) => set.weight)) : 0;
  const increment = Math.max(0.5, Number(exerciseItem.increment) || 2.5);
  const majority = Math.ceil(sets.length * 0.66);
  const topRangeHits = sets.filter((set) => set.reps >= p.max && set.rir >= Math.max(1, p.rir - 1)).length;
  const underRangeHits = sets.filter((set) => set.reps < p.min || set.rir === 0).length;
  const qualityHits = sets.filter((set) => set.reps >= p.min && set.rir >= Math.max(1, p.rir - 1)).length;
  const avgRir = sets.reduce((sum, set) => sum + set.rir, 0) / sets.length;

  if (["bodyweight", "band", "time"].includes(exerciseItem.loadType)) {
    return bodyweightAdvice(goal, topRangeHits, underRangeHits, majority, trend, referenceWeight);
  }

  const hold = (action, status = trend.status === "regression" ? "caution" : "hold") => ({
    nextWeight: referenceWeight || null,
    status,
    badge: status === "caution" ? "↔ Protege rendimiento" : "↔ Mantener",
    strategy: "hold",
    action,
    trend,
  });

  const progress = (action) => ({
    nextWeight: adjustment(referenceWeight, increment, 1),
    status: "progress",
    badge: "↑ Progresar",
    strategy: "load",
    action,
    trend,
  });

  const recover = (action) => ({
    nextWeight: adjustment(referenceWeight, increment, -1),
    status: "regression",
    badge: "↓ Fatiga objetiva",
    strategy: "recover",
    action,
    trend,
  });

  if (goal === "pr") {
    if (exerciseItem.prRole === "secondary") {
      if (trend.status === "regression" && underRangeHits >= majority) {
        return recover(`Baja ${increment} kg en la exposición técnica; recupera velocidad y margen.`);
      }
      return hold("Exposición técnica: conserva la carga y mejora velocidad, pausa y consistencia. No persigas carga aquí.");
    }

    if (topRangeHits >= majority && avgRir >= p.rir && trend.status !== "regression") {
      return progress(`PR principal: sube ${increment} kg manteniendo margen técnico; no es un intento máximo.`);
    }
    if (trend.status === "regression" && underRangeHits >= majority) {
      return recover(`Tres exposiciones muestran caída: baja ${increment} kg y reconstruye calidad antes del pico.`);
    }
    return hold("PR principal: mantén carga hasta dominar el rango con el RIR prescrito antes de subir.");
  }

  if (goal === "fuerza") {
    if (topRangeHits >= majority && qualityHits >= majority && trend.status !== "regression") {
      return progress(`Sube ${increment} kg: ya dominas el rango de fuerza con margen suficiente.`);
    }
    if (trend.status === "regression" && underRangeHits >= majority) {
      return recover(`Regresión confirmada en varias exposiciones: baja ${increment} kg y recupera calidad técnica.`);
    }
    return hold("Mantén la carga y consolida reps limpias; fuerza progresa por calidad, no por forzar cada sesión.");
  }

  if (goal === "potencia") {
    if (topRangeHits === sets.length && avgRir >= p.rir && trend.status !== "regression") {
      return progress(`Sube ${increment} kg solo si la intención explosiva se mantiene igual de rápida.`);
    }
    if (trend.status === "regression" && underRangeHits >= majority) {
      return recover(`Baja ${increment} kg para recuperar velocidad e intención explosiva.`);
    }
    return hold("Mantén carga. En potencia, la calidad y la velocidad intencional mandan sobre añadir peso.");
  }

  if (goal === "resistencia") {
    if (topRangeHits >= majority && trend.status !== "regression") {
      return progress(`Sube ${increment} kg o conserva carga y reduce ligeramente el descanso para aumentar densidad.`);
    }
    if (trend.status === "regression" && underRangeHits >= majority) {
      return recover(`Baja ${increment} kg y recupera el rango alto de repeticiones sin llegar al fallo.`);
    }
    return hold("Mantén carga y suma repeticiones dentro del rango antes de subir peso.");
  }

  if (goal === "perdida") {
    if (topRangeHits >= majority && trend.status !== "regression") {
      return progress(`Sube ${increment} kg con prudencia: el objetivo es conservar o mejorar rendimiento durante el déficit.`);
    }
    if (trend.status === "regression" && underRangeHits >= majority) {
      return recover(`La caída se repite en varias sesiones: baja ${increment} kg temporalmente y protege la técnica.`);
    }
    return hold("Mantén carga. No reduzcas peso por una sola sesión mala durante el déficit.");
  }

  // Hipertrofia: doble progresión, pero solo descarga ante una regresión repetida.
  if (topRangeHits >= majority && trend.status !== "regression") {
    return progress(`Sube ${increment} kg: la mayoría de series ya alcanzó el techo de reps con RIR suficiente.`);
  }
  if (trend.status === "regression" && underRangeHits >= majority) {
    return recover(`Tres exposiciones muestran caída: baja ${increment} kg y vuelve a acumular reps de calidad.`);
  }
  return hold("Mantén carga y suma repeticiones con el RIR objetivo; no cambies peso por una sola sesión floja.");
}
