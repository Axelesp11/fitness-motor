export function sessionLogsSinceLastCompletion(exerciseLogs = [], sessionCompletions = [], sessionLabel) {
  const lastCompletion = sessionCompletions
    .filter((item) => item?.sessionLabel === sessionLabel)
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    .at(-1);
  const threshold = lastCompletion ? new Date(lastCompletion.createdAt).getTime() : 0;

  return exerciseLogs.filter((log) => (
    log?.sessionLabel === sessionLabel
    && new Date(log.createdAt || 0).getTime() > threshold
  ));
}

export function sessionProgress(session, exerciseLogs = [], sessionCompletions = []) {
  const planned = session?.exercises?.length ?? 0;
  const currentLogs = sessionLogsSinceLastCompletion(exerciseLogs, sessionCompletions, session?.label);
  const completedIds = new Set(currentLogs.map((log) => log.exerciseId));
  const completed = (session?.exercises ?? []).filter((item) => completedIds.has(item.id)).length;
  const percent = planned ? Math.round((completed / planned) * 100) : 0;

  return {
    planned,
    completed,
    percent,
    canFinish: completed > 0,
    currentLogs,
  };
}
