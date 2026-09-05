export const STORAGE_KEY = "fitness-motor-v3";
export const SCHEMA_VERSION = 3;

export const DEFAULT_PROFILE = {
  peso: 75,
  estatura: 172,
  edad: 24,
  sexo: "hombre",
  experiencia: "nunca",
  objetivo: "hipertrofia",
  dias: 3,
  actividad: "sedentario",
  equipo: "gym",
  duracion: 60,
  enfoque: "balanced",
};

export const DEFAULT_READINESS = { energia: 4, sueno: 4, dolor: 2 };

export function createDefaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { ...DEFAULT_PROFILE },
    readiness: { ...DEFAULT_READINESS },
    exerciseLogs: [],
    bodyLogs: [],
    sessionCompletions: [],
    startedAt: new Date().toISOString(),
  };
}

export function loadState(storage = window.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) return sanitizeState(JSON.parse(raw));
  } catch {
    // Fall through to migration/default state.
  }
  return migrateLegacy(storage);
}

export function saveState(state, storage = window.localStorage) {
  const clean = sanitizeState(state);
  storage.setItem(STORAGE_KEY, JSON.stringify(clean));
  return clean;
}

export function serializeState(state) {
  return JSON.stringify(sanitizeState(state), null, 2);
}

export function parseImportedState(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("El archivo no contiene JSON válido.");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("El archivo no contiene un estado válido.");
  return sanitizeState(parsed);
}

export function sanitizeState(input) {
  const base = createDefaultState();
  const profile = { ...DEFAULT_PROFILE, ...(input?.profile ?? {}) };
  const readiness = { ...DEFAULT_READINESS, ...(input?.readiness ?? {}) };

  return {
    schemaVersion: SCHEMA_VERSION,
    profile: sanitizeProfile(profile),
    readiness: sanitizeReadiness(readiness),
    exerciseLogs: Array.isArray(input?.exerciseLogs) ? input.exerciseLogs.map(sanitizeExerciseLog).filter(Boolean).slice(-1000) : [],
    bodyLogs: Array.isArray(input?.bodyLogs) ? input.bodyLogs.map(sanitizeBodyLog).filter(Boolean).slice(-365) : [],
    sessionCompletions: Array.isArray(input?.sessionCompletions)
      ? input.sessionCompletions.map(sanitizeCompletion).filter(Boolean).slice(-500)
      : [],
    startedAt: validIso(input?.startedAt) ? input.startedAt : base.startedAt,
  };
}

function migrateLegacy(storage) {
  const state = createDefaultState();
  try {
    const profile = readJson(storage, "fitness-motor-profile");
    const readiness = readJson(storage, "fitness-motor-readiness");
    const legacyLogs = readJson(storage, "fitness-motor-logs");

    if (profile && typeof profile === "object") state.profile = sanitizeProfile({ ...state.profile, ...profile });
    if (readiness && typeof readiness === "object") state.readiness = sanitizeReadiness({ ...state.readiness, ...readiness });
    if (Array.isArray(legacyLogs)) {
      state.exerciseLogs = legacyLogs.map((log, index) => sanitizeExerciseLog({
        id: log.id || `legacy-${index}-${Date.now()}`,
        createdAt: log.createdAt,
        sessionLabel: log.session,
        exerciseId: log.exerciseId,
        exerciseName: log.exerciseName,
        sets: [{ weight: log.weight, reps: log.reps, rir: log.rir }],
      })).filter(Boolean);
    }
  } catch {
    return state;
  }
  return state;
}

function sanitizeProfile(profile) {
  return {
    peso: clampNumber(profile.peso, 35, 250, DEFAULT_PROFILE.peso),
    estatura: clampNumber(profile.estatura, 120, 230, DEFAULT_PROFILE.estatura),
    edad: clampNumber(profile.edad, 18, 90, DEFAULT_PROFILE.edad),
    sexo: ["hombre", "mujer"].includes(profile.sexo) ? profile.sexo : DEFAULT_PROFILE.sexo,
    experiencia: ["nunca", "basico", "intermedio"].includes(profile.experiencia) ? profile.experiencia : DEFAULT_PROFILE.experiencia,
    objetivo: ["hipertrofia", "fuerza", "perdida"].includes(profile.objetivo) ? profile.objetivo : DEFAULT_PROFILE.objetivo,
    dias: clampNumber(profile.dias, 2, 6, DEFAULT_PROFILE.dias),
    actividad: ["sedentario", "ligero", "activo", "muy_activo"].includes(profile.actividad) ? profile.actividad : DEFAULT_PROFILE.actividad,
    equipo: ["gym", "home", "minimal"].includes(profile.equipo) ? profile.equipo : DEFAULT_PROFILE.equipo,
    duracion: [45, 60, 75, 90].includes(Number(profile.duracion)) ? Number(profile.duracion) : DEFAULT_PROFILE.duracion,
    enfoque: ["balanced", "Pecho", "Espalda", "Piernas", "Hombro", "Brazos"].includes(profile.enfoque) ? profile.enfoque : DEFAULT_PROFILE.enfoque,
  };
}

function sanitizeReadiness(value) {
  return {
    energia: clampNumber(value.energia, 1, 5, DEFAULT_READINESS.energia),
    sueno: clampNumber(value.sueno, 1, 5, DEFAULT_READINESS.sueno),
    dolor: clampNumber(value.dolor, 1, 5, DEFAULT_READINESS.dolor),
  };
}

function sanitizeExerciseLog(log) {
  if (!log || !log.exerciseId || !Array.isArray(log.sets)) return null;
  const sets = log.sets.map((set) => ({
    weight: Math.max(0, finiteNumber(set?.weight, 0)),
    reps: Math.max(0, Math.round(finiteNumber(set?.reps, 0))),
    rir: Math.min(8, Math.max(0, Math.round(finiteNumber(set?.rir, 0)))),
  })).filter((set) => set.reps > 0);
  if (!sets.length) return null;

  return {
    id: String(log.id || cryptoSafeId()),
    createdAt: validIso(log.createdAt) ? log.createdAt : new Date().toISOString(),
    sessionLabel: String(log.sessionLabel || log.session || "Sesión"),
    exerciseId: String(log.exerciseId),
    exerciseName: String(log.exerciseName || log.exerciseId),
    sets,
  };
}

function sanitizeBodyLog(log) {
  if (!log || !validDate(log.date) || !Number.isFinite(Number(log.weight))) return null;
  const calories = Number(log.calories);
  return {
    id: String(log.id || cryptoSafeId()),
    date: log.date,
    weight: clampNumber(log.weight, 25, 350, 75),
    calories: Number.isFinite(calories) && calories > 0 ? Math.round(calories) : null,
  };
}

function sanitizeCompletion(item) {
  if (!item) return null;
  return {
    id: String(item.id || cryptoSafeId()),
    createdAt: validIso(item.createdAt) ? item.createdAt : new Date().toISOString(),
    sessionLabel: String(item.sessionLabel || "Sesión"),
  };
}

function readJson(storage, key) {
  const raw = storage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function finiteNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampNumber(value, min, max, fallback) {
  return Math.min(max, Math.max(min, finiteNumber(value, fallback)));
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function cryptoSafeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
