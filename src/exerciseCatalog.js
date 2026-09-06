function exercise(id, name, group, type, equipment, increment, secondary = [], loadType = "external") {
  return Object.freeze({
    id,
    name,
    group,
    type,
    equipment: Object.freeze([...equipment]),
    increment,
    secondary: Object.freeze([...secondary]),
    loadType,
  });
}

const CATALOG = [
  exercise("bench_press", "Press banca", "Pecho", "compound", ["gym"], 2.5, ["Triceps", "Hombro"]),
  exercise("incline_db_press", "Press inclinado con mancuernas", "Pecho", "compound", ["gym", "home"], 2, ["Triceps", "Hombro"]),
  exercise("machine_press", "Press en máquina", "Pecho", "compound", ["gym"], 2.5, ["Triceps", "Hombro"]),
  exercise("push_up", "Flexiones", "Pecho", "compound", ["gym", "home", "minimal"], 1, ["Triceps", "Hombro"], "bodyweight"),
  exercise("band_chest_press", "Press de pecho con banda", "Pecho", "compound", ["minimal"], 1, ["Triceps", "Hombro"], "band"),
  exercise("cable_fly", "Aperturas en polea", "Pecho", "isolation", ["gym"], 2.5),
  exercise("db_fly", "Aperturas con mancuernas", "Pecho", "isolation", ["gym", "home"], 1),

  exercise("lat_pulldown", "Jalón al pecho", "Espalda", "compound", ["gym"], 2.5, ["Biceps"]),
  exercise("barbell_row", "Remo con barra", "Espalda", "compound", ["gym"], 2.5, ["Biceps", "Posterior"]),
  exercise("one_arm_db_row", "Remo con mancuerna", "Espalda", "compound", ["gym", "home"], 2, ["Biceps"]),
  exercise("cable_row", "Remo sentado en polea", "Espalda", "compound", ["gym"], 2.5, ["Biceps"]),
  exercise("pull_up", "Dominadas", "Espalda", "compound", ["gym", "home", "minimal"], 1, ["Biceps"], "bodyweight"),
  exercise("band_row", "Remo con banda", "Espalda", "compound", ["minimal"], 1, ["Biceps"], "band"),
  exercise("straight_arm_pulldown", "Pullover en polea", "Espalda", "isolation", ["gym"], 2.5),

  exercise("back_squat", "Sentadilla trasera", "Cuadriceps", "compound", ["gym"], 5, ["Posterior", "Core"]),
  exercise("leg_press", "Prensa de pierna", "Cuadriceps", "compound", ["gym"], 5, ["Posterior"]),
  exercise("hack_squat", "Hack squat", "Cuadriceps", "compound", ["gym"], 5, ["Posterior"]),
  exercise("goblet_squat", "Sentadilla goblet", "Cuadriceps", "compound", ["gym", "home"], 2, ["Posterior", "Core"]),
  exercise("split_squat", "Sentadilla búlgara", "Cuadriceps", "compound", ["gym", "home", "minimal"], 2, ["Posterior"]),
  exercise("bodyweight_squat", "Sentadilla con peso corporal", "Cuadriceps", "compound", ["minimal"], 1, ["Posterior"], "bodyweight"),
  exercise("leg_extension", "Extensión de cuádriceps", "Cuadriceps", "isolation", ["gym"], 2.5),

  exercise("deadlift", "Peso muerto convencional", "Posterior", "compound", ["gym"], 5, ["Espalda", "Core", "Cuadriceps"]),
  exercise("rdl", "Peso muerto rumano", "Posterior", "compound", ["gym"], 5, ["Espalda", "Core"]),
  exercise("db_rdl", "Peso muerto rumano con mancuernas", "Posterior", "compound", ["gym", "home"], 2, ["Espalda", "Core"]),
  exercise("hip_thrust", "Hip thrust", "Posterior", "compound", ["gym", "home"], 5, ["Core"]),
  exercise("leg_curl", "Curl femoral", "Posterior", "isolation", ["gym"], 2.5),
  exercise("single_leg_bridge", "Puente de glúteo unilateral", "Posterior", "isolation", ["home", "minimal"], 1, ["Core"], "bodyweight"),
  exercise("band_good_morning", "Buenos días con banda", "Posterior", "compound", ["minimal"], 1, ["Core"], "band"),

  exercise("overhead_press", "Press militar", "Hombro", "compound", ["gym"], 2.5, ["Triceps"]),
  exercise("db_shoulder_press", "Press de hombro con mancuernas", "Hombro", "compound", ["gym", "home"], 2, ["Triceps"]),
  exercise("pike_pushup", "Flexión pike", "Hombro", "compound", ["minimal"], 1, ["Triceps"], "bodyweight"),
  exercise("lateral_raise", "Elevaciones laterales", "Hombro", "isolation", ["gym", "home"], 1),
  exercise("band_lateral_raise", "Elevación lateral con banda", "Hombro", "isolation", ["minimal"], 1, [], "band"),
  exercise("rear_delt_fly", "Pájaros / deltoide posterior", "Hombro", "isolation", ["gym", "home"], 1, ["Espalda"]),
  exercise("face_pull", "Face pull", "Hombro", "isolation", ["gym", "minimal"], 1, ["Espalda"], "band"),

  exercise("db_curl", "Curl con mancuernas", "Biceps", "isolation", ["gym", "home"], 1),
  exercise("cable_curl", "Curl en polea", "Biceps", "isolation", ["gym"], 2.5),
  exercise("hammer_curl", "Curl martillo", "Biceps", "isolation", ["gym", "home"], 1),
  exercise("band_curl", "Curl con banda", "Biceps", "isolation", ["minimal"], 1, [], "band"),
  exercise("chin_up", "Dominada supina", "Biceps", "compound", ["minimal", "gym", "home"], 1, ["Espalda"], "bodyweight"),

  exercise("triceps_pushdown", "Extensión de tríceps en polea", "Triceps", "isolation", ["gym"], 2.5),
  exercise("overhead_triceps", "Extensión de tríceps sobre cabeza", "Triceps", "isolation", ["gym", "home"], 1),
  exercise("close_grip_pushup", "Flexión cerrada", "Triceps", "compound", ["gym", "home", "minimal"], 1, ["Pecho"], "bodyweight"),
  exercise("band_pushdown", "Extensión de tríceps con banda", "Triceps", "isolation", ["minimal"], 1, [], "band"),

  exercise("cable_crunch", "Crunch en polea", "Core", "isolation", ["gym"], 2.5),
  exercise("plank", "Plancha", "Core", "isolation", ["gym", "home", "minimal"], 5, [], "time"),
  exercise("dead_bug", "Dead bug", "Core", "isolation", ["gym", "home", "minimal"], 1, [], "bodyweight"),
  exercise("hanging_leg_raise", "Elevación de piernas colgado", "Core", "isolation", ["gym", "home"], 1, [], "bodyweight"),
  exercise("band_pallof_press", "Pallof press con banda", "Core", "isolation", ["minimal"], 1, [], "band"),
];

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export const EXERCISE_CATALOG = Object.freeze(CATALOG);

export function getExerciseById(id) {
  return BY_ID.get(String(id || "")) ?? null;
}

export function compatibleExercises({ group, type, equipment, excludeId = null } = {}) {
  return CATALOG.filter((item) => (
    (!group || item.group === group)
    && (!type || item.type === type)
    && (!equipment || item.equipment.includes(equipment))
    && (!excludeId || item.id !== excludeId)
  ));
}

export function inferPlanEquipment(plan) {
  const exercises = (plan?.sessions ?? []).flatMap((session) => session.exercises ?? []);
  if (!exercises.length) return "gym";

  const supportedByAll = ["minimal", "home", "gym"].filter((mode) => (
    exercises.every((item) => Array.isArray(item.equipment) && item.equipment.includes(mode))
  ));

  if (supportedByAll.length) return supportedByAll[0];

  const counts = Object.fromEntries(["minimal", "home", "gym"].map((mode) => [
    mode,
    exercises.filter((item) => Array.isArray(item.equipment) && item.equipment.includes(mode)).length,
  ]));
  return ["minimal", "home", "gym"].sort((a, b) => counts[b] - counts[a])[0];
}
