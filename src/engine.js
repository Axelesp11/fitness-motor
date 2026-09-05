export const GOAL_LABELS = {
  hipertrofia: "Hipertrofia",
  fuerza: "Fuerza",
  perdida: "Pérdida de grasa",
};

export const EXPERIENCE_LABELS = {
  nunca: "Principiante",
  basico: "Básico",
  intermedio: "Intermedio",
};

export const ACTIVITY_LABELS = {
  sedentario: "Sedentaria",
  ligero: "Ligera",
  activo: "Activa",
  muy_activo: "Muy activa",
};

export const EQUIPMENT_LABELS = {
  gym: "Gimnasio completo",
  home: "Casa / mancuernas",
  minimal: "Peso corporal / bandas",
};

export const FOCUS_OPTIONS = [
  ["balanced", "Equilibrado"],
  ["Pecho", "Pecho"],
  ["Espalda", "Espalda"],
  ["Piernas", "Piernas"],
  ["Hombro", "Hombros"],
  ["Brazos", "Brazos"],
];

const NON_TRAINING_ACTIVITY = {
  sedentario: 1.2,
  ligero: 1.35,
  activo: 1.5,
  muy_activo: 1.65,
};

const GOAL_RATE_PER_WEEK = {
  hipertrofia: 0.0025,
  fuerza: 0,
  perdida: -0.005,
};

const MESOCYCLE_RIR = [3, 3, 2, 2, 1, 4];

const MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Cuadriceps",
  "Posterior",
  "Hombro",
  "Biceps",
  "Triceps",
  "Core",
];

const LIBRARY = {
  Pecho: [
    exercise("bench_press", "Press banca", "compound", ["gym"], 2.5, ["Triceps", "Hombro"]),
    exercise("incline_db_press", "Press inclinado con mancuernas", "compound", ["gym", "home"], 2, ["Triceps", "Hombro"]),
    exercise("machine_press", "Press en máquina", "compound", ["gym"], 2.5, ["Triceps", "Hombro"]),
    exercise("push_up", "Flexiones", "compound", ["gym", "home", "minimal"], 1, ["Triceps", "Hombro"], "bodyweight"),
    exercise("band_chest_press", "Press de pecho con banda", "compound", ["minimal"], 1, ["Triceps", "Hombro"], "band"),
    exercise("cable_fly", "Aperturas en polea", "isolation", ["gym"], 2.5),
    exercise("db_fly", "Aperturas con mancuernas", "isolation", ["gym", "home"], 1),
  ],
  Espalda: [
    exercise("lat_pulldown", "Jalón al pecho", "compound", ["gym"], 2.5, ["Biceps"]),
    exercise("barbell_row", "Remo con barra", "compound", ["gym"], 2.5, ["Biceps", "Posterior"]),
    exercise("one_arm_db_row", "Remo con mancuerna", "compound", ["gym", "home"], 2, ["Biceps"]),
    exercise("cable_row", "Remo sentado en polea", "compound", ["gym"], 2.5, ["Biceps"]),
    exercise("pull_up", "Dominadas", "compound", ["gym", "home", "minimal"], 1, ["Biceps"], "bodyweight"),
    exercise("band_row", "Remo con banda", "compound", ["minimal"], 1, ["Biceps"], "band"),
    exercise("straight_arm_pulldown", "Pullover en polea", "isolation", ["gym"], 2.5),
  ],
  Cuadriceps: [
    exercise("back_squat", "Sentadilla trasera", "compound", ["gym"], 5, ["Posterior", "Core"]),
    exercise("leg_press", "Prensa de pierna", "compound", ["gym"], 5, ["Posterior"]),
    exercise("hack_squat", "Hack squat", "compound", ["gym"], 5, ["Posterior"]),
    exercise("goblet_squat", "Sentadilla goblet", "compound", ["gym", "home"], 2, ["Posterior", "Core"]),
    exercise("split_squat", "Sentadilla búlgara", "compound", ["gym", "home", "minimal"], 2, ["Posterior"]),
    exercise("bodyweight_squat", "Sentadilla con peso corporal", "compound", ["minimal"], 1, ["Posterior"], "bodyweight"),
    exercise("leg_extension", "Extensión de cuádriceps", "isolation", ["gym"], 2.5),
  ],
  Posterior: [
    exercise("rdl", "Peso muerto rumano", "compound", ["gym"], 5, ["Espalda", "Core"]),
    exercise("db_rdl", "Peso muerto rumano con mancuernas", "compound", ["gym", "home"], 2, ["Espalda", "Core"]),
    exercise("hip_thrust", "Hip thrust", "compound", ["gym", "home"], 5, ["Core"]),
    exercise("leg_curl", "Curl femoral", "isolation", ["gym"], 2.5),
    exercise("single_leg_bridge", "Puente de glúteo unilateral", "isolation", ["home", "minimal"], 1, ["Core"], "bodyweight"),
    exercise("band_good_morning", "Buenos días con banda", "compound", ["minimal"], 1, ["Core"], "band"),
  ],
  Hombro: [
    exercise("overhead_press", "Press militar", "compound", ["gym"], 2.5, ["Triceps"]),
    exercise("db_shoulder_press", "Press de hombro con mancuernas", "compound", ["gym", "home"], 2, ["Triceps"]),
    exercise("pike_pushup", "Flexión pike", "compound", ["minimal"], 1, ["Triceps"], "bodyweight"),
    exercise("lateral_raise", "Elevaciones laterales", "isolation", ["gym", "home"], 1),
    exercise("band_lateral_raise", "Elevación lateral con banda", "isolation", ["minimal"], 1, [], "band"),
    exercise("rear_delt_fly", "Pájaros / deltoide posterior", "isolation", ["gym", "home"], 1, ["Espalda"]),
    exercise("face_pull", "Face pull", "isolation", ["gym", "minimal"], 1, ["Espalda"], "band"),
  ],
  Biceps: [
    exercise("db_curl", "Curl con mancuernas", "isolation", ["gym", "home"], 1),
    exercise("cable_curl", "Curl en polea", "isolation", ["gym"], 2.5),
    exercise("hammer_curl", "Curl martillo", "isolation", ["gym", "home"], 1),
    exercise("band_curl", "Curl con banda", "isolation", ["minimal"], 1, [], "band"),
    exercise("chin_up", "Dominada supina", "compound", ["minimal", "gym", "home"], 1, ["Espalda"], "bodyweight"),
  ],
  Triceps: [
    exercise("triceps_pushdown", "Extensión de tríceps en polea", "isolation", ["gym"], 2.5),
    exercise("overhead_triceps", "Extensión de tríceps sobre cabeza", "isolation", ["gym", "home"], 1),
    exercise("close_grip_pushup", "Flexión cerrada", "compound", ["gym", "home", "minimal"], 1, ["Pecho"], "bodyweight"),
    exercise("band_pushdown", "Extensión de tríceps con banda", "isolation", ["minimal"], 1, [], "band"),
  ],
  Core: [
    exercise("cable_crunch", "Crunch en polea", "isolation", ["gym"], 2.5),
    exercise("plank", "Plancha", "isolation", ["gym", "home", "minimal"], 5, [], "time"),
    exercise("dead_bug", "Dead bug", "isolation", ["gym", "home", "minimal"], 1, [], "bodyweight"),
    exercise("hanging_leg_raise", "Elevación de piernas colgado", "isolation", ["gym", "home"], 1, [], "bodyweight"),
    exercise("band_pallof_press", "Pallof press con banda", "isolation", ["minimal"], 1, [], "band"),
  ],
};

const SESSION_TEMPLATES = {
  fullbody: [["Cuadriceps", 1], ["Pecho", 1], ["Espalda", 1], ["Posterior", 1], ["Hombro", 1], ["Core", 1]],
  upper: [["Pecho", 2], ["Espalda", 2], ["Hombro", 1], ["Biceps", 1], ["Triceps", 1]],
  lower: [["Cuadriceps", 2], ["Posterior", 1], ["Core", 1]],
  push: [["Pecho", 2], ["Hombro", 2], ["Triceps", 2]],
  pull: [["Espalda", 3], ["Biceps", 2], ["Hombro", 1]],
  legs: [["Cuadriceps", 2], ["Posterior", 2], ["Core", 1]],
};

function exercise(id, name, type, equipment, increment, secondary = [], loadType = "external") {
  return { id, name, type, equipment, increment, secondary, loadType };
}

export function calcBMR({ peso, estatura, edad, sexo }) {
  const weight = safeNumber(peso, 75);
  const height = safeNumber(estatura, 170);
  const age = safeNumber(edad, 30);
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sexo === "mujer" ? base - 161 : base + 5;
}

export function calcFormulaTDEE(profile) {
  const bmr = calcBMR(profile);
  const activity = NON_TRAINING_ACTIVITY[profile.actividad] ?? NON_TRAINING_ACTIVITY.sedentario;
  const weight = safeNumber(profile.peso, 75);
  const days = clamp(safeNumber(profile.dias, 3), 0, 7);
  const durationHours = clamp(safeNumber(profile.duracion, 60), 15, 180) / 60;
  const netResistanceTrainingMet = 3.5;
  const weeklyTrainingEnergy = weight * netResistanceTrainingMet * durationHours * days;
  return Math.round(bmr * activity + weeklyTrainingEnergy / 7);
}

export function weightTrend(bodyLogs = []) {
  const points = bodyLogs
    .filter((x) => validDate(x.date) && Number.isFinite(Number(x.weight)))
    .map((x) => ({ date: x.date, weight: Number(x.weight) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!points.length) return { current: null, weeklyChangeKg: null, weeklyChangePct: null, points: [] };

  let ema = points[0].weight;
  const smoothed = points.map((point, index) => {
    if (index > 0) ema = 0.35 * point.weight + 0.65 * ema;
    return { ...point, trend: round(ema, 2) };
  });

  const slope = linearSlopePerDay(smoothed.map((x) => ({ date: x.date, value: x.trend })));
  const current = smoothed.at(-1).trend;
  const weeklyChangeKg = slope == null ? null : slope * 7;
  const weeklyChangePct = weeklyChangeKg == null || !current ? null : weeklyChangeKg / current;

  return {
    current,
    weeklyChangeKg: weeklyChangeKg == null ? null : round(weeklyChangeKg, 2),
    weeklyChangePct: weeklyChangePct == null ? null : round(weeklyChangePct, 4),
    points: smoothed,
  };
}

export function estimateAdaptiveExpenditure(profile, bodyLogs = []) {
  const formula = calcFormulaTDEE(profile);
  const usable = bodyLogs
    .filter((x) => validDate(x.date) && Number.isFinite(Number(x.weight)) && Number.isFinite(Number(x.calories)) && Number(x.calories) > 0)
    .map((x) => ({ date: x.date, weight: Number(x.weight), calories: Number(x.calories) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (usable.length < 7) {
    return { expenditure: formula, formula, adaptive: null, confidence: 0, source: "formula" };
  }

  const spanDays = daysBetween(usable[0].date, usable.at(-1).date);
  if (spanDays < 6) {
    return { expenditure: formula, formula, adaptive: null, confidence: 0, source: "formula" };
  }

  const trendPoints = weightTrend(usable).points;
  const slopeKgPerDay = linearSlopePerDay(trendPoints.map((x) => ({ date: x.date, value: x.trend })));
  const avgCalories = average(usable.map((x) => x.calories));
  if (slopeKgPerDay == null || avgCalories == null) {
    return { expenditure: formula, formula, adaptive: null, confidence: 0, source: "formula" };
  }

  const rawAdaptive = avgCalories - slopeKgPerDay * 7700;
  const boundedAdaptive = clamp(rawAdaptive, formula * 0.7, formula * 1.3);
  const coverage = clamp(usable.length / 14, 0, 1);
  const spanConfidence = clamp(spanDays / 14, 0, 1);
  const confidence = round(Math.min(coverage, spanConfidence), 2);
  const expenditure = Math.round(formula * (1 - confidence) + boundedAdaptive * confidence);

  return {
    expenditure,
    formula,
    adaptive: Math.round(boundedAdaptive),
    confidence,
    source: confidence >= 0.5 ? "adaptive" : "blended",
  };
}

export function calcNutrition(profile, bodyLogs = []) {
  const expenditure = estimateAdaptiveExpenditure(profile, bodyLogs);
  const weight = safeNumber(profile.peso, 75);
  const goalRate = GOAL_RATE_PER_WEEK[profile.objetivo] ?? 0;
  const desiredEnergyDelta = weight * goalRate * 7700 / 7;
  const target = Math.max(1200, Math.round(expenditure.expenditure + desiredEnergyDelta));

  const proteinPerKg = profile.objetivo === "perdida" ? 2.0 : 1.8;
  const protein = Math.min(220, Math.round(weight * proteinPerKg));
  const fat = Math.min(120, Math.max(45, Math.round(weight * 0.8)));
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  const trend = weightTrend(bodyLogs);

  return {
    bmr: Math.round(calcBMR(profile)),
    expenditure,
    target,
    macros: { protein, fat, carbs },
    goalRate,
    trend,
  };
}

export function defineSplit(days) {
  const d = clamp(Math.round(safeNumber(days, 3)), 2, 6);
  if (d <= 3) {
    return {
      name: "Full Body",
      sessions: Array.from({ length: d }, (_, i) => ({ label: `Día ${i + 1} · Full Body`, template: "fullbody" })),
    };
  }
  if (d === 4) {
    return {
      name: "Upper / Lower",
      sessions: [
        { label: "Día 1 · Upper A", template: "upper" },
        { label: "Día 2 · Lower A", template: "lower" },
        { label: "Día 3 · Upper B", template: "upper" },
        { label: "Día 4 · Lower B", template: "lower" },
      ],
    };
  }
  if (d === 5) {
    return {
      name: "PPL + Upper / Lower",
      sessions: [
        { label: "Día 1 · Push", template: "push" },
        { label: "Día 2 · Pull", template: "pull" },
        { label: "Día 3 · Legs", template: "legs" },
        { label: "Día 4 · Upper", template: "upper" },
        { label: "Día 5 · Lower", template: "lower" },
      ],
    };
  }
  return {
    name: "Push / Pull / Legs ×2",
    sessions: [
      { label: "Día 1 · Push A", template: "push" },
      { label: "Día 2 · Pull A", template: "pull" },
      { label: "Día 3 · Legs A", template: "legs" },
      { label: "Día 4 · Push B", template: "push" },
      { label: "Día 5 · Pull B", template: "pull" },
      { label: "Día 6 · Legs B", template: "legs" },
    ],
  };
}

export function calcReadiness({ energia, sueno, dolor }) {
  const energy = clamp(safeNumber(energia, 3), 1, 5);
  const sleep = clamp(safeNumber(sueno, 3), 1, 5);
  const soreness = clamp(safeNumber(dolor, 3), 1, 5);
  const score = energy + sleep + (6 - soreness);
  if (soreness >= 5 || score <= 7) {
    return { score, status: "deload", label: "Descarga", setDelta: -1, rirDelta: 1 };
  }
  if (score <= 10) {
    return { score, status: "fatigue", label: "Fatiga alta", setDelta: -1, rirDelta: 0 };
  }
  return { score, status: "ready", label: "Listo", setDelta: 0, rirDelta: 0 };
}

export function mesocycleState(sessionCompletions = [], plannedDays = 3) {
  const completed = sessionCompletions.length;
  const days = clamp(Math.round(safeNumber(plannedDays, 3)), 2, 6);
  const week = Math.floor(completed / days) % 6 + 1;
  return {
    week,
    targetRir: MESOCYCLE_RIR[week - 1],
    isPlannedDeload: week === 6,
  };
}

function prescription(goal, type, experience, readiness, mesocycle, focusBonus = false) {
  const compound = type === "compound";
  const base = {
    hipertrofia: compound
      ? { sets: 3, min: 6, max: 10, rest: 150 }
      : { sets: 2, min: 10, max: 15, rest: 90 },
    fuerza: compound
      ? { sets: 3, min: 3, max: 6, rest: 210 }
      : { sets: 2, min: 8, max: 12, rest: 120 },
    perdida: compound
      ? { sets: 2, min: 6, max: 10, rest: 135 }
      : { sets: 2, min: 10, max: 15, rest: 90 },
  }[goal] ?? { sets: 2, min: 8, max: 12, rest: 120 };

  const experienceDelta = experience === "nunca" ? -1 : 0;
  const deloadDelta = mesocycle.isPlannedDeload ? -1 : 0;
  const sets = clamp(base.sets + experienceDelta + readiness.setDelta + deloadDelta + (focusBonus && experience !== "nunca" ? 1 : 0), 1, 5);
  const targetRir = Math.max(mesocycle.targetRir, goal === "fuerza" ? 2 : 1) + readiness.rirDelta;

  return { ...base, sets, rir: clamp(targetRir, 1, 5) };
}

function exercisesFor(template, equipment, sessionIndex, focus) {
  const result = [];
  const spec = SESSION_TEMPLATES[template] ?? SESSION_TEMPLATES.fullbody;
  const focusGroups = focusToGroups(focus);

  for (const [group, count] of spec) {
    const available = (LIBRARY[group] ?? []).filter((e) => e.equipment.includes(equipment));
    for (let i = 0; i < count && available.length; i += 1) {
      const offset = focusGroups.includes(group) ? 1 : 0;
      const pick = available[(sessionIndex + i + offset) % available.length];
      if (pick && !result.some((x) => x.id === pick.id)) result.push({ ...pick, group });
    }
  }
  return result;
}

function focusToGroups(focus) {
  if (focus === "Piernas") return ["Cuadriceps", "Posterior"];
  if (focus === "Brazos") return ["Biceps", "Triceps"];
  if (MUSCLE_GROUPS.includes(focus)) return [focus];
  return [];
}

export function buildPlan(profile, readinessInput, sessionCompletions = []) {
  const split = defineSplit(profile.dias);
  const readiness = calcReadiness(readinessInput);
  const mesocycle = mesocycleState(sessionCompletions, profile.dias);
  const maxExercises = { 45: 5, 60: 6, 75: 7, 90: 8 }[Number(profile.duracion)] ?? 6;
  const focusGroups = focusToGroups(profile.enfoque);

  const sessions = split.sessions.map((session, sessionIndex) => {
    const raw = exercisesFor(session.template, profile.equipo, sessionIndex, profile.enfoque).slice(0, maxExercises);
    return {
      ...session,
      exercises: raw.map((exerciseItem) => ({
        ...exerciseItem,
        prescription: prescription(
          profile.objetivo,
          exerciseItem.type,
          profile.experiencia,
          readiness,
          mesocycle,
          focusGroups.includes(exerciseItem.group),
        ),
      })),
    };
  });

  return {
    ...split,
    sessions,
    readiness,
    mesocycle,
    weeklyVolume: calculateWeeklyVolume(sessions),
  };
}

export function calculateWeeklyVolume(sessions) {
  const volume = Object.fromEntries(MUSCLE_GROUPS.map((group) => [group, 0]));
  for (const session of sessions) {
    for (const item of session.exercises) {
      volume[item.group] += item.prescription.sets;
      for (const secondary of item.secondary ?? []) {
        if (secondary in volume) volume[secondary] += item.prescription.sets * 0.5;
      }
    }
  }
  return Object.fromEntries(Object.entries(volume).map(([key, value]) => [key, round(value, 1)]));
}

export function normalizeSet(set) {
  return {
    weight: Math.max(0, safeNumber(set?.weight, 0)),
    reps: Math.max(0, Math.round(safeNumber(set?.reps, 0))),
    rir: clamp(Math.round(safeNumber(set?.rir, 0)), 0, 8),
  };
}

export function estimate1RM(weight, reps) {
  const w = safeNumber(weight, 0);
  const r = safeNumber(reps, 0);
  if (w <= 0 || r <= 0 || r > 15) return null;
  return round(w * (1 + r / 30), 1);
}

export function summarizeExerciseLog(log) {
  const sets = (log?.sets ?? []).map(normalizeSet).filter((s) => s.reps > 0);
  if (!sets.length) return { avgReps: 0, avgRir: 0, bestE1RM: null, tonnage: 0 };
  const e1rms = sets.map((s) => estimate1RM(s.weight, s.reps)).filter((x) => x != null);
  return {
    avgReps: round(average(sets.map((s) => s.reps)), 1),
    avgRir: round(average(sets.map((s) => s.rir)), 1),
    bestE1RM: e1rms.length ? Math.max(...e1rms) : null,
    tonnage: Math.round(sets.reduce((sum, s) => sum + s.weight * s.reps, 0)),
  };
}

export function nextLoadAdvice(exerciseItem, previousLog) {
  const p = exerciseItem.prescription;
  if (!previousLog?.sets?.length) {
    return { nextWeight: null, action: "Usa una carga cómoda y deja el RIR indicado." };
  }

  const sets = previousLog.sets.map(normalizeSet).filter((s) => s.reps > 0);
  if (!sets.length) return { nextWeight: null, action: "Completa al menos una serie para activar la progresión." };

  const weightedSets = sets.filter((s) => s.weight > 0);
  const referenceWeight = weightedSets.length ? median(weightedSets.map((s) => s.weight)) : 0;
  const topRangeHits = sets.filter((s) => s.reps >= p.max && s.rir >= Math.max(1, p.rir - 1)).length;
  const underRangeHits = sets.filter((s) => s.reps < p.min || s.rir === 0).length;
  const majority = Math.ceil(sets.length * 0.66);

  if (exerciseItem.loadType === "bodyweight" || exerciseItem.loadType === "band" || exerciseItem.loadType === "time") {
    if (topRangeHits >= majority) {
      return { nextWeight: referenceWeight || null, action: "Sube la dificultad: más reps, tempo, banda o lastre." };
    }
    if (underRangeHits >= majority) {
      return { nextWeight: referenceWeight || null, action: "Reduce dificultad y recupera el rango objetivo." };
    }
    return { nextWeight: referenceWeight || null, action: "Mantén la variante e intenta mejorar una repetición." };
  }

  if (topRangeHits >= majority) {
    return {
      nextWeight: roundToIncrement(referenceWeight + exerciseItem.increment, exerciseItem.increment),
      action: `Sube ${exerciseItem.increment} kg la próxima vez.`,
    };
  }

  if (underRangeHits >= majority) {
    return {
      nextWeight: Math.max(0, roundToIncrement(referenceWeight - exerciseItem.increment, exerciseItem.increment)),
      action: `Baja ${exerciseItem.increment} kg y recupera técnica/rango.`,
    };
  }

  return { nextWeight: referenceWeight || null, action: "Mantén carga y suma repeticiones con el RIR objetivo." };
}

export function getExerciseBest(logs, exerciseId) {
  const relevant = logs.filter((log) => log.exerciseId === exerciseId);
  let bestE1RM = null;
  let bestTonnage = 0;
  for (const log of relevant) {
    const summary = summarizeExerciseLog(log);
    if (summary.bestE1RM != null && (bestE1RM == null || summary.bestE1RM > bestE1RM)) bestE1RM = summary.bestE1RM;
    bestTonnage = Math.max(bestTonnage, summary.tonnage);
  }
  return { bestE1RM, bestTonnage };
}

export function detectPR(logsBefore, newLog) {
  const before = getExerciseBest(logsBefore, newLog.exerciseId);
  const after = summarizeExerciseLog(newLog);
  const e1rmPR = after.bestE1RM != null && (before.bestE1RM == null || after.bestE1RM > before.bestE1RM + 0.1);
  const volumePR = after.tonnage > 0 && after.tonnage > before.bestTonnage;
  return { e1rmPR, volumePR, summary: after };
}

export function warmupPlan(workWeight, increment = 2.5) {
  const weight = safeNumber(workWeight, 0);
  if (weight <= 0) return [];
  return [
    { pct: 0.4, reps: 8 },
    { pct: 0.6, reps: 5 },
    { pct: 0.75, reps: 3 },
  ].map((x) => ({
    weight: Math.max(increment, roundToIncrement(weight * x.pct, increment)),
    reps: x.reps,
  }));
}

export function formatRest(seconds) {
  const value = Math.max(0, Math.round(safeNumber(seconds, 0)));
  if (value < 60) return `${value}s`;
  const min = Math.floor(value / 60);
  const sec = value % 60;
  return sec ? `${min}m ${sec}s` : `${min}m`;
}

function linearSlopePerDay(points) {
  if (points.length < 2) return null;
  const start = new Date(`${points[0].date}T00:00:00Z`).getTime();
  const xs = points.map((p) => (new Date(`${p.date}T00:00:00Z`).getTime() - start) / 86400000);
  const ys = points.map((p) => Number(p.value));
  const xMean = average(xs);
  const yMean = average(ys);
  const numerator = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  if (!denominator) return null;
  return numerator / denominator;
}

function daysBetween(a, b) {
  const start = new Date(`${a}T00:00:00Z`).getTime();
  const end = new Date(`${b}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86400000));
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
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

function safeNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
