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

const ACTIVIDAD_BASE = { sedentario: 1.2, ligero: 1.375, activo: 1.55 };
const ENTRENO_ADD = { 2: 0.08, 3: 0.12, 4: 0.16, 5: 0.2, 6: 0.24 };

const LIBRARY = {
  Pecho: [
    { id: "bench_press", name: "Press banca", type: "compound", equipment: ["gym"], increment: 2.5 },
    { id: "incline_db_press", name: "Press inclinado con mancuernas", type: "compound", equipment: ["gym", "home"], increment: 2 },
    { id: "push_up", name: "Flexiones", type: "compound", equipment: ["gym", "home"], increment: 1 },
    { id: "cable_fly", name: "Aperturas en polea", type: "isolation", equipment: ["gym"], increment: 2.5 },
  ],
  Espalda: [
    { id: "lat_pulldown", name: "Jalón al pecho", type: "compound", equipment: ["gym"], increment: 2.5 },
    { id: "barbell_row", name: "Remo con barra", type: "compound", equipment: ["gym"], increment: 2.5 },
    { id: "one_arm_db_row", name: "Remo con mancuerna", type: "compound", equipment: ["gym", "home"], increment: 2 },
    { id: "pull_up", name: "Dominadas", type: "compound", equipment: ["gym", "home"], increment: 1 },
    { id: "cable_row", name: "Remo sentado en polea", type: "compound", equipment: ["gym"], increment: 2.5 },
  ],
  Cuadriceps: [
    { id: "back_squat", name: "Sentadilla trasera", type: "compound", equipment: ["gym"], increment: 5 },
    { id: "leg_press", name: "Prensa de pierna", type: "compound", equipment: ["gym"], increment: 5 },
    { id: "goblet_squat", name: "Sentadilla goblet", type: "compound", equipment: ["gym", "home"], increment: 2 },
    { id: "split_squat", name: "Sentadilla búlgara", type: "compound", equipment: ["gym", "home"], increment: 2 },
    { id: "leg_extension", name: "Extensión de cuádriceps", type: "isolation", equipment: ["gym"], increment: 2.5 },
  ],
  Posterior: [
    { id: "rdl", name: "Peso muerto rumano", type: "compound", equipment: ["gym", "home"], increment: 5 },
    { id: "hip_thrust", name: "Hip thrust", type: "compound", equipment: ["gym", "home"], increment: 5 },
    { id: "leg_curl", name: "Curl femoral", type: "isolation", equipment: ["gym"], increment: 2.5 },
    { id: "db_rdl", name: "Peso muerto rumano con mancuernas", type: "compound", equipment: ["gym", "home"], increment: 2 },
  ],
  Hombro: [
    { id: "overhead_press", name: "Press militar", type: "compound", equipment: ["gym"], increment: 2.5 },
    { id: "db_shoulder_press", name: "Press hombro con mancuernas", type: "compound", equipment: ["gym", "home"], increment: 2 },
    { id: "lateral_raise", name: "Elevaciones laterales", type: "isolation", equipment: ["gym", "home"], increment: 1 },
    { id: "rear_delt_fly", name: "Pájaros / deltoide posterior", type: "isolation", equipment: ["gym", "home"], increment: 1 },
  ],
  Biceps: [
    { id: "db_curl", name: "Curl con mancuernas", type: "isolation", equipment: ["gym", "home"], increment: 1 },
    { id: "cable_curl", name: "Curl en polea", type: "isolation", equipment: ["gym"], increment: 2.5 },
    { id: "hammer_curl", name: "Curl martillo", type: "isolation", equipment: ["gym", "home"], increment: 1 },
  ],
  Triceps: [
    { id: "triceps_pushdown", name: "Extensión de tríceps en polea", type: "isolation", equipment: ["gym"], increment: 2.5 },
    { id: "overhead_triceps", name: "Extensión de tríceps sobre cabeza", type: "isolation", equipment: ["gym", "home"], increment: 1 },
    { id: "close_grip_pushup", name: "Flexión cerrada", type: "compound", equipment: ["gym", "home"], increment: 1 },
  ],
  Core: [
    { id: "cable_crunch", name: "Crunch en polea", type: "isolation", equipment: ["gym"], increment: 2.5 },
    { id: "plank", name: "Plancha", type: "isolation", equipment: ["gym", "home"], increment: 5 },
    { id: "dead_bug", name: "Dead bug", type: "isolation", equipment: ["gym", "home"], increment: 1 },
  ],
};

const SESSION_TEMPLATES = {
  fullbody: [
    ["Pecho", 1], ["Espalda", 1], ["Cuadriceps", 1], ["Posterior", 1], ["Hombro", 1], ["Core", 1],
  ],
  upper: [
    ["Pecho", 2], ["Espalda", 2], ["Hombro", 1], ["Biceps", 1], ["Triceps", 1],
  ],
  lower: [["Cuadriceps", 2], ["Posterior", 2], ["Core", 1]],
  push: [["Pecho", 2], ["Hombro", 2], ["Triceps", 2]],
  pull: [["Espalda", 3], ["Biceps", 2]],
  legs: [["Cuadriceps", 2], ["Posterior", 2], ["Core", 1]],
};

function calcBMR({ peso, estatura, edad, sexo }) {
  const base = 10 * peso + 6.25 * estatura - 5 * edad;
  return sexo === "hombre" ? base + 5 : base - 161;
}

export function calcNutrition(form) {
  const bmr = calcBMR(form);
  const activity = ACTIVIDAD_BASE[form.actividad] || 1.2;
  const training = ENTRENO_ADD[form.dias] || 0.12;
  const tdee = Math.round(bmr * (activity + training));

  let target = tdee;
  if (form.objetivo === "perdida") target = Math.round(tdee * 0.82);
  if (form.objetivo === "hipertrofia") target = Math.round(tdee * 1.06);

  const proteinPerKg = form.objetivo === "perdida" ? 2.2 : 2.0;
  const protein = Math.round(form.peso * proteinPerKg);
  const fat = Math.round(form.peso * 0.8);
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));

  return {
    bmr: Math.round(bmr),
    tdee,
    target,
    macros: { protein, fat, carbs },
  };
}

export function defineSplit(days, experience) {
  const cap = { nunca: 4, basico: 5, intermedio: 6 }[experience] || 6;
  const d = Math.min(Number(days), cap);

  if (experience === "nunca" || d <= 3) {
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
    name: "Push / Pull / Legs x2",
    sessions: [
      { label: "Día 1 · Push A", template: "push" },
      { label: "Día 2 · Pull A", template: "pull" },
      { label: "Día 3 · Legs A", template: "legs" },
      { label: "Día 4 · Push B", template: "push" },
      { label: "Día 5 · Pull B", template: "pull" },
      { label: "Día 6 · Legs B", template: "legs" },
    ].slice(0, d),
  };
}

export function calcReadiness({ energia, sueno, dolor }) {
  const score = Number(energia) + Number(sueno) + (6 - Number(dolor));
  if (score <= 7) return { score, status: "deload", label: "Descarga", setDelta: -1, rirDelta: 1 };
  if (score <= 10) return { score, status: "fatigue", label: "Fatiga alta", setDelta: -1, rirDelta: 0 };
  return { score, status: "ready", label: "Listo", setDelta: 0, rirDelta: 0 };
}

function prescription(goal, type, readiness) {
  const isCompound = type === "compound";
  const base = {
    hipertrofia: isCompound
      ? { sets: 3, min: 6, max: 10, rir: 2, rest: 150 }
      : { sets: 3, min: 10, max: 15, rir: 2, rest: 90 },
    fuerza: isCompound
      ? { sets: 4, min: 3, max: 6, rir: 2, rest: 210 }
      : { sets: 3, min: 6, max: 10, rir: 2, rest: 120 },
    perdida: isCompound
      ? { sets: 3, min: 6, max: 10, rir: 2, rest: 120 }
      : { sets: 2, min: 10, max: 15, rir: 2, rest: 75 },
  }[goal];

  return {
    ...base,
    sets: Math.max(1, base.sets + readiness.setDelta),
    rir: base.rir + readiness.rirDelta,
  };
}

function exercisesFor(template, equipment, sessionIndex) {
  const result = [];
  const spec = SESSION_TEMPLATES[template];

  spec.forEach(([group, count], groupIndex) => {
    const available = LIBRARY[group].filter((e) => e.equipment.includes(equipment));
    for (let i = 0; i < count; i += 1) {
      const pick = available[(sessionIndex + groupIndex + i) % available.length];
      if (pick && !result.some((x) => x.id === pick.id)) result.push({ ...pick, group });
    }
  });

  return result;
}

export function buildPlan(form, readinessInput) {
  const split = defineSplit(form.dias, form.experiencia);
  const readiness = calcReadiness(readinessInput);
  const maxExercises = { 45: 5, 60: 6, 75: 7, 90: 8 }[Number(form.duracion)] || 6;

  const sessions = split.sessions.map((session, sessionIndex) => {
    const raw = exercisesFor(session.template, form.equipo, sessionIndex).slice(0, maxExercises);
    return {
      ...session,
      exercises: raw.map((exercise) => ({
        ...exercise,
        prescription: prescription(form.objetivo, exercise.type, readiness),
      })),
    };
  });

  return { ...split, sessions, readiness };
}

export function nextLoadAdvice(exercise, log) {
  if (!log || !Number.isFinite(Number(log.weight)) || Number(log.weight) <= 0) {
    return { nextWeight: null, action: "Registra una carga para activar la progresión." };
  }

  const weight = Number(log.weight);
  const reps = Number(log.reps);
  const rir = Number(log.rir);
  const { min, max } = exercise.prescription;

  if (reps >= max && rir >= 1) {
    return {
      nextWeight: Math.max(0, weight + exercise.increment),
      action: `Sube ${exercise.increment} kg la próxima sesión.`,
    };
  }

  if (reps < min && rir <= 0) {
    return {
      nextWeight: Math.max(0, weight - exercise.increment),
      action: `Baja ${exercise.increment} kg para recuperar el rango objetivo.`,
    };
  }

  return { nextWeight: weight, action: "Mantén la carga e intenta sumar repeticiones." };
}

export function formatRest(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec ? `${min}m ${sec}s` : `${min}m`;
}
