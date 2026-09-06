import { calculateWeeklyVolume } from "./engine.js";

export const PROGRAM_GOAL_LABELS = {
  hipertrofia: "Hipertrofia",
  fuerza: "Fuerza",
  pr: "PR / pico de fuerza",
  potencia: "Potencia",
  resistencia: "Resistencia muscular",
  perdida: "Pérdida de grasa",
};

export const SPLIT_OPTIONS = [
  [2, "Full Body ×2"],
  [3, "Full Body ×3"],
  [4, "Upper / Lower"],
  [5, "PPL + Upper / Lower"],
  [6, "Push / Pull / Legs ×2"],
];

export const PR_LIFT_OPTIONS = [
  ["bench_press", "Press banca"],
  ["back_squat", "Sentadilla trasera"],
  ["deadlift", "Peso muerto"],
  ["overhead_press", "Press militar"],
];

const PR_LIFTS = {
  bench_press: {
    id: "bench_press",
    name: "Press banca",
    group: "Pecho",
    type: "compound",
    equipment: ["gym"],
    increment: 2.5,
    secondary: ["Triceps", "Hombro"],
    loadType: "external",
    suitableTemplates: ["fullbody", "upper", "push"],
  },
  back_squat: {
    id: "back_squat",
    name: "Sentadilla trasera",
    group: "Cuadriceps",
    type: "compound",
    equipment: ["gym"],
    increment: 5,
    secondary: ["Posterior", "Core"],
    loadType: "external",
    suitableTemplates: ["fullbody", "lower", "legs"],
  },
  deadlift: {
    id: "deadlift",
    name: "Peso muerto convencional",
    group: "Posterior",
    type: "compound",
    equipment: ["gym"],
    increment: 5,
    secondary: ["Espalda", "Core", "Cuadriceps"],
    loadType: "external",
    suitableTemplates: ["fullbody", "lower", "legs", "pull"],
  },
  overhead_press: {
    id: "overhead_press",
    name: "Press militar",
    group: "Hombro",
    type: "compound",
    equipment: ["gym"],
    increment: 2.5,
    secondary: ["Triceps"],
    loadType: "external",
    suitableTemplates: ["fullbody", "upper", "push"],
  },
};

const GOAL_RULES = {
  hipertrofia: {
    title: "Volumen + proximidad al fallo controlada",
    summary: "Prioriza varias series por músculo, rangos moderados y trabajo suficientemente cerca del fallo sin exigir fallo muscular.",
    primaryRange: "6–10 reps",
    accessoryRange: "10–15 reps",
    rest: "2–3 min compuestos · 1–2 min aislamientos",
    volume: "Objetivo práctico: acercarse o superar ~10 series semanales por músculo cuando recuperación y experiencia lo permiten.",
    evidence: ["ACSM 2026", "Robinson 2024", "Schoenfeld 2017"],
  },
  fuerza: {
    title: "Carga alta + especificidad técnica",
    summary: "Da prioridad a movimientos compuestos, cargas altas, pocas repeticiones y descansos largos para sostener la calidad de cada serie.",
    primaryRange: "3–6 reps",
    accessoryRange: "6–10 reps",
    rest: "3–5 min compuestos · ~2 min accesorios",
    volume: "La carga alta (≈≥80% 1RM) tiene ventaja para fuerza; el volumen accesorio se mantiene suficiente pero secundario.",
    evidence: ["ACSM 2026", "Currier 2023"],
  },
  pr: {
    title: "Bloque específico para mejorar un levantamiento",
    summary: "Aumenta la exposición al levantamiento objetivo y reduce trabajo irrelevante. No auto-prescribe un 1RM máximo: prepara el pico y usa repeticiones bajas con margen técnico.",
    primaryRange: "2–4 reps",
    accessoryRange: "3–8 reps",
    rest: "4–5 min levantamiento PR · 3–4 min compuestos",
    volume: "Dos exposiciones semanales al levantamiento objetivo cuando el split lo permite; una principal y otra técnica.",
    evidence: ["ACSM 2026", "Currier 2023"],
  },
  potencia: {
    title: "Velocidad intencional + fatiga baja",
    summary: "Usa pocas repeticiones, descansos amplios e intención concéntrica explosiva. La serie termina antes de que la velocidad caiga claramente.",
    primaryRange: "2–5 reps",
    accessoryRange: "5–8 reps",
    rest: "2.5–4 min",
    volume: "Volumen bajo a moderado para conservar velocidad; la calidad de ejecución manda sobre la fatiga acumulada.",
    evidence: ["ACSM 2026"],
  },
  resistencia: {
    title: "Más repeticiones + descansos cortos",
    summary: "Eleva repeticiones con cargas ligeras/moderadas y recuperaciones más cortas para desarrollar resistencia muscular local.",
    primaryRange: "12–20 reps",
    accessoryRange: "15–25 reps",
    rest: "45–90 s",
    volume: "Se prioriza tolerancia al trabajo y densidad, sin convertir todas las series en fallo muscular.",
    evidence: ["ACSM progression models", "ACSM 2026"],
  },
  perdida: {
    title: "Conservar músculo durante el déficit",
    summary: "No usa 'repeticiones para quemar grasa'. Mantiene estímulo de fuerza/hipertrofia y reduce algo el volumen cuando el déficit limita recuperación.",
    primaryRange: "5–10 reps",
    accessoryRange: "8–15 reps",
    rest: "2–3 min compuestos · 1–2 min accesorios",
    volume: "Volumen moderado con buena intensidad; el déficit energético produce la pérdida de grasa y las pesas ayudan a preservar masa libre de grasa.",
    evidence: ["ACSM 2026", "Miller 2025"],
  },
};

function focusMatches(profile, group) {
  if (profile.enfoque === "balanced") return false;
  if (profile.enfoque === "Piernas") return ["Cuadriceps", "Posterior"].includes(group);
  if (profile.enfoque === "Brazos") return ["Biceps", "Triceps"].includes(group);
  return profile.enfoque === group;
}

function readinessAdjustments(basePlan) {
  const status = basePlan.readiness?.status;
  return {
    setDelta: status === "deload" || status === "fatigue" ? -1 : 0,
    rirDelta: status === "deload" ? 1 : 0,
  };
}

function weekRir(goal, week) {
  const maps = {
    hipertrofia: [3, 3, 2, 2, 1, 4],
    fuerza: [3, 3, 2, 2, 2, 4],
    pr: [3, 3, 2, 2, 1, 4],
    potencia: [4, 4, 3, 3, 3, 4],
    resistencia: [3, 3, 2, 2, 2, 4],
    perdida: [3, 3, 2, 2, 2, 4],
  };
  return (maps[goal] ?? maps.hipertrofia)[Math.min(5, Math.max(0, Number(week || 1) - 1))];
}

function basePrescription(goal, exerciseItem, isPrPrimary = false, isPrSecondary = false) {
  const compound = exerciseItem.type === "compound";

  if (goal === "pr") {
    if (isPrPrimary) return { sets: 4, min: 2, max: 4, rest: 300, intent: "Técnica específica · sin grind" };
    if (isPrSecondary) return { sets: 3, min: 3, max: 5, rest: 240, intent: "Exposición técnica submáxima" };
    return compound
      ? { sets: 3, min: 3, max: 6, rest: 240, intent: "Fuerza específica" }
      : { sets: 2, min: 6, max: 10, rest: 120, intent: "Accesorio de soporte" };
  }

  if (goal === "fuerza") {
    return compound
      ? { sets: 3, min: 3, max: 6, rest: 240, intent: "Carga alta · técnica consistente" }
      : { sets: 2, min: 6, max: 10, rest: 120, intent: "Accesorio de fuerza" };
  }

  if (goal === "potencia") {
    return compound
      ? { sets: 3, min: 2, max: 5, rest: 210, intent: "Concéntrica explosiva · corta antes de perder velocidad" }
      : { sets: 2, min: 5, max: 8, rest: 120, intent: "Accesorio sin fatiga excesiva" };
  }

  if (goal === "resistencia") {
    return compound
      ? { sets: 3, min: 12, max: 20, rest: 75, intent: "Ritmo estable · técnica limpia" }
      : { sets: 2, min: 15, max: 25, rest: 60, intent: "Densidad de trabajo" };
  }

  if (goal === "perdida") {
    return compound
      ? { sets: 2, min: 5, max: 10, rest: 150, intent: "Mantén fuerza durante el déficit" }
      : { sets: 2, min: 8, max: 15, rest: 90, intent: "Conserva estímulo muscular" };
  }

  return compound
    ? { sets: 3, min: 6, max: 10, rest: 150, intent: "Tensión mecánica + técnica" }
    : { sets: 3, min: 10, max: 15, rest: 90, intent: "Acumula reps cerca del fallo técnico" };
}

function applyPrescription(exerciseItem, profile, basePlan, flags = {}) {
  const goal = profile.objetivo;
  const base = basePrescription(goal, exerciseItem, flags.isPrPrimary, flags.isPrSecondary);
  const readiness = readinessAdjustments(basePlan);
  const noviceDelta = profile.experiencia === "nunca" ? -1 : 0;
  const focusDelta = goal === "hipertrofia" && profile.experiencia !== "nunca" && focusMatches(profile, exerciseItem.group) ? 1 : 0;
  const plannedDeloadDelta = basePlan.mesocycle?.isPlannedDeload ? -1 : 0;
  const sets = Math.max(1, Math.min(5, base.sets + noviceDelta + focusDelta + readiness.setDelta + plannedDeloadDelta));
  const rir = Math.max(1, Math.min(5, weekRir(goal, basePlan.mesocycle?.week) + readiness.rirDelta));

  return {
    ...base,
    sets,
    rir,
  };
}

function injectPrLift(sessions, profile) {
  const lift = PR_LIFTS[profile.prLift] ?? PR_LIFTS.bench_press;
  if (profile.objetivo !== "pr") return { sessions, warning: null };
  if (profile.equipo !== "gym") {
    return {
      sessions,
      warning: "El modo PR específico requiere gimnasio/barra para los levantamientos configurados. Se mantiene una programación de fuerza general con tu equipo actual.",
    };
  }

  let exposure = 0;
  const next = sessions.map((session) => {
    if (exposure >= 2 || !lift.suitableTemplates.includes(session.template)) return session;
    const exercises = [...session.exercises];
    const replaceIndex = exercises.findIndex((item) => item.group === lift.group && item.type === "compound");
    const prItem = {
      ...lift,
      prRole: exposure === 0 ? "primary" : "secondary",
    };

    if (replaceIndex >= 0) exercises[replaceIndex] = prItem;
    else exercises.unshift(prItem);
    exposure += 1;
    return { ...session, exercises };
  });

  return {
    sessions: next,
    warning: exposure < 2
      ? "El split actual solo permite una exposición clara al levantamiento PR. Para un bloque más específico, usa 3+ días Full Body, Upper/Lower o PPL de 5–6 días."
      : null,
  };
}

function trimForGoal(sessions, goal) {
  if (!['pr', 'potencia'].includes(goal)) return sessions;
  const maxExercises = goal === "pr" ? 6 : 5;
  return sessions.map((session) => ({
    ...session,
    exercises: session.exercises
      .sort((a, b) => {
        if (a.prRole && !b.prRole) return -1;
        if (!a.prRole && b.prRole) return 1;
        if (a.type === "compound" && b.type !== "compound") return -1;
        if (a.type !== "compound" && b.type === "compound") return 1;
        return 0;
      })
      .slice(0, maxExercises),
  }));
}

export function adaptTrainingPlan(basePlan, profile) {
  const injected = injectPrLift(basePlan.sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((item) => ({ ...item })),
  })), profile);

  const trimmed = trimForGoal(injected.sessions, profile.objetivo);
  let prPrimarySeen = false;
  const sessions = trimmed.map((session) => ({
    ...session,
    exercises: session.exercises.map((exerciseItem) => {
      const isPrPrimary = exerciseItem.prRole === "primary" && !prPrimarySeen;
      const isPrSecondary = exerciseItem.prRole === "secondary";
      if (isPrPrimary) prPrimarySeen = true;
      return {
        ...exerciseItem,
        prescription: applyPrescription(exerciseItem, profile, basePlan, { isPrPrimary, isPrSecondary }),
      };
    }),
  }));

  const rule = GOAL_RULES[profile.objetivo] ?? GOAL_RULES.hipertrofia;
  const splitNote = splitRationale(Number(profile.dias), profile.objetivo);

  return {
    ...basePlan,
    sessions,
    weeklyVolume: calculateWeeklyVolume(sessions),
    programming: {
      ...rule,
      splitNote,
      warning: injected.warning,
    },
  };
}

export function splitRationale(days, goal = "hipertrofia") {
  const d = Number(days);
  if (d <= 3) {
    return "Full Body distribuye cada patrón varias veces por semana con pocas sesiones; es eficiente cuando solo hay 2–3 días disponibles.";
  }
  if (d === 4) {
    return "Upper/Lower reparte el trabajo en cuatro sesiones y facilita repetir tren superior e inferior dos veces por semana.";
  }
  if (d === 5) {
    return "PPL + Upper/Lower combina especialización y una segunda exposición semanal a los grandes grupos musculares.";
  }
  if (goal === "hipertrofia") {
    return "PPL ×2 distribuye volumen alto en seis sesiones y evita concentrar demasiadas series de un músculo en un solo día.";
  }
  return "PPL ×2 permite alta frecuencia de práctica y repartir la fatiga; el objetivo sigue determinando reps, RIR, descansos y volumen.";
}

export function goalRule(goal) {
  return GOAL_RULES[goal] ?? GOAL_RULES.hipertrofia;
}
