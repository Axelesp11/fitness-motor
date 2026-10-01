const RANKS = [
  { name: "Noob", at: 0, tone: "slate" },
  { name: "Principiante", at: 1, tone: "mint" },
  { name: "Constante", at: 5, tone: "aqua" },
  { name: "Intermedio", at: 15, tone: "blue" },
  { name: "Pro", at: 35, tone: "violet" },
  { name: "Élite", at: 75, tone: "gold" },
  { name: "Leyenda", at: 150, tone: "flame" },
];

export function trainingAchievements({ sessionCompletions = [], exerciseLogs = [], bodyLogs = [] } = {}) {
  const sessions = new Set(sessionCompletions.map((item) => item?.sessionId || item?.id).filter(Boolean)).size;
  const loggedExercises = exerciseLogs.length;
  const sleepDays = new Set(bodyLogs.filter((item) => item?.sleepHours != null).map((item) => item.date)).size;
  const completeDays = new Set(bodyLogs.filter((item) => item?.sleepHours != null && item?.calories != null).map((item) => item.date)).size;
  const currentIndex = RANKS.findLastIndex((rank) => sessions >= rank.at);
  const rank = RANKS[currentIndex];
  const nextRank = RANKS[currentIndex + 1] ?? null;
  const progress = nextRank ? Math.round((sessions - rank.at) / (nextRank.at - rank.at) * 100) : 100;
  const milestones = [
    { id: "first", name: "Primer entrenamiento", detail: "Termina tu primera sesión", icon: "01", current: sessions, target: 1 },
    { id: "five", name: "En marcha", detail: "Termina 5 sesiones", icon: "05", current: sessions, target: 5 },
    { id: "twenty", name: "Ritmo propio", detail: "Termina 20 sesiones", icon: "20", current: sessions, target: 20 },
    { id: "fifty", name: "Trayectoria", detail: "Termina 50 sesiones", icon: "50", current: sessions, target: 50 },
    { id: "logging", name: "Cada serie cuenta", detail: "Guarda 25 ejercicios", icon: "SR", current: loggedExercises, target: 25 },
    { id: "sleep", name: "Descanso registrado", detail: "Anota 7 noches de sueño", icon: "ZZ", current: sleepDays, target: 7 },
    { id: "habits", name: "Panorama completo", detail: "Anota sueño y calorías durante 7 días", icon: "07", current: completeDays, target: 7 },
  ].map((item) => ({ ...item, unlocked: item.current >= item.target, current: Math.min(item.current, item.target) }));

  return { rank, tier: currentIndex + 1, nextRank, sessions, progress, remaining: nextRank ? nextRank.at - sessions : 0, milestones, unlocked: milestones.filter((item) => item.unlocked).length };
}
