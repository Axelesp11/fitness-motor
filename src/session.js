function safeTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function snapshotExercise(item) {
  return {
    id: String(item?.id || "exercise"),
    name: String(item?.name || item?.id || "Ejercicio"),
    group: String(item?.group || "Otro"),
    type: item?.type === "isolation" ? "isolation" : "compound",
    loadType: String(item?.loadType || "external"),
    increment: Number.isFinite(Number(item?.increment)) ? Number(item.increment) : 1,
    secondary: Array.isArray(item?.secondary) ? item.secondary.map(String).slice(0, 8) : [],
    prRole: item?.prRole === "primary" || item?.prRole === "secondary" ? item.prRole : null,
    substitutionSourceId: item?.substitutionSourceId ? String(item.substitutionSourceId) : null,
    prescription: {
      sets: Math.max(1, Math.round(Number(item?.prescription?.sets) || 1)),
      min: Math.max(1, Math.round(Number(item?.prescription?.min) || 1)),
      max: Math.max(1, Math.round(Number(item?.prescription?.max) || 1)),
      rir: Math.max(0, Math.min(8, Math.round(Number(item?.prescription?.rir) || 0))),
      rest: Math.max(0, Math.round(Number(item?.prescription?.rest) || 0)),
      intent: String(item?.prescription?.intent || "Técnica consistente"),
    },
  };
}

export function snapshotSession(session) {
  if (!session) return null;
  return {
    label: String(session.label || "Sesión"),
    template: String(session.template || "session"),
    exercises: (session.exercises ?? []).map(snapshotExercise).slice(0, 30),
  };
}

export function createWorkoutSession(session, sessionIndex = 0, idFactory = null, now = new Date(), metadata = {}) {
  const id = idFactory?.() ?? globalThis.crypto?.randomUUID?.() ?? `${now.getTime()}-${Math.random().toString(36).slice(2)}`;
  const sessionSnapshot = snapshotSession(session);
  return {
    id,
    sessionLabel: String(session?.label || "Sesión"),
    sessionIndex: Math.max(0, Number(sessionIndex) || 0),
    startedAt: now.toISOString(),
    plannedExerciseIds: (session?.exercises ?? []).map((item) => String(item.id)),
    sessionSnapshot,
    planContext: {
      objective: metadata.objective ? String(metadata.objective) : null,
      week: Number.isFinite(Number(metadata.week)) ? Number(metadata.week) : null,
      targetRir: metadata.targetRir != null ? String(metadata.targetRir) : null,
      fatigueStatus: metadata.fatigueStatus ? String(metadata.fatigueStatus) : null,
    },
  };
}

export function sessionForWorkout(activeWorkout, fallbackSession) {
  if (activeWorkout?.sessionSnapshot?.exercises?.length) return activeWorkout.sessionSnapshot;
  return fallbackSession;
}

export function sessionLogsSinceLastCompletion(exerciseLogs = [], sessionCompletions = [], sessionLabel) {
  const lastCompletion = sessionCompletions
    .filter((item) => item?.sessionLabel === sessionLabel)
    .sort((a, b) => safeTime(a.createdAt) - safeTime(b.createdAt))
    .at(-1);
  const threshold = lastCompletion ? safeTime(lastCompletion.createdAt) : 0;

  return exerciseLogs.filter((log) => (
    log?.sessionLabel === sessionLabel
    && safeTime(log.createdAt) > threshold
  ));
}

export function workoutLogs(exerciseLogs = [], sessionCompletions = [], session, activeWorkout = null) {
  if (activeWorkout?.id && activeWorkout.sessionLabel === session?.label) {
    return exerciseLogs.filter((log) => log?.sessionId === activeWorkout.id);
  }
  return sessionLogsSinceLastCompletion(exerciseLogs, sessionCompletions, session?.label);
}

export function historicalLogsOutsideWorkout(exerciseLogs = [], activeWorkout = null, exerciseId = null) {
  return exerciseLogs.filter((log) => {
    if (activeWorkout?.id && log?.sessionId === activeWorkout.id) return false;
    if (exerciseId && log?.exerciseId !== exerciseId) return true;
    return true;
  });
}

export function discardWorkoutLogs(exerciseLogs = [], activeWorkout = null) {
  if (!activeWorkout?.id) return exerciseLogs;
  return exerciseLogs.filter((log) => log?.sessionId !== activeWorkout.id);
}

export function sessionProgress(session, exerciseLogs = [], sessionCompletions = [], activeWorkout = null) {
  const planned = session?.exercises?.length ?? 0;
  const currentLogs = workoutLogs(exerciseLogs, sessionCompletions, session, activeWorkout);
  const completedIds = new Set(currentLogs.map((log) => log.exerciseId));
  const completed = (session?.exercises ?? []).filter((item) => completedIds.has(item.id)).length;
  const percent = planned ? Math.round((completed / planned) * 100) : 0;
  const minimumToFinish = planned ? Math.max(1, Math.ceil(planned * 0.5)) : 1;

  return {
    planned,
    completed,
    percent,
    minimumToFinish,
    canFinish: completed >= minimumToFinish,
    currentLogs,
    active: Boolean(activeWorkout?.id && activeWorkout.sessionLabel === session?.label),
  };
}

export function completeWorkout(activeWorkout, progress, now = new Date(), idFactory = null) {
  if (!activeWorkout?.id) throw new Error("No hay una sesión activa.");
  if (!progress?.canFinish) throw new Error("La sesión no alcanza el mínimo para finalizar.");
  const id = idFactory?.() ?? globalThis.crypto?.randomUUID?.() ?? `${now.getTime()}-${Math.random().toString(36).slice(2)}`;
  const started = safeTime(activeWorkout.startedAt) || now.getTime();
  const durationSec = Math.max(0, Math.round((now.getTime() - started) / 1000));

  return {
    id,
    sessionId: activeWorkout.id,
    sessionLabel: activeWorkout.sessionLabel,
    startedAt: activeWorkout.startedAt,
    createdAt: now.toISOString(),
    durationSec,
    completedExercises: Number(progress.completed || 0),
    plannedExercises: Number(progress.planned || 0),
    completionPct: Number(progress.percent || 0),
    objective: activeWorkout.planContext?.objective || null,
  };
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
