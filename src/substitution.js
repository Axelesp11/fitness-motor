import { calculateWeeklyVolume } from "./engine.js";

export function substitutionKey(session, exerciseItem) {
  const sourceId = exerciseItem?.substitutionSourceId || exerciseItem?.id || "exercise";
  return `${session?.label || session?.template || "session"}:${sourceId}`;
}

function flattenExercises(plan) {
  const unique = new Map();
  for (const session of plan?.sessions ?? []) {
    for (const item of session.exercises ?? []) {
      if (!unique.has(item.id)) unique.set(item.id, item);
    }
  }
  return [...unique.values()];
}

export function substitutionOptions(plan, exerciseItem) {
  if (!exerciseItem) return [];
  const source = exerciseItem.substitutionSource ?? exerciseItem;
  const candidates = flattenExercises(plan).filter((candidate) => (
    candidate.group === source.group
    && candidate.type === source.type
    && candidate.id !== source.id
  ));

  const deduped = new Map([[source.id, source], ...candidates.map((item) => [item.id, item])]);
  return [...deduped.values()].slice(0, 6);
}

export function applyExerciseSubstitutions(plan, substitutions = {}) {
  if (!plan?.sessions?.length) return plan;
  const catalog = new Map(flattenExercises(plan).map((item) => [item.id, item]));

  const sessions = plan.sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((item) => {
      const key = substitutionKey(session, item);
      const replacementId = substitutions[key];
      if (!replacementId || replacementId === item.id) return { ...item, substitutionSourceId: item.id, substitutionSource: item };
      const replacement = catalog.get(replacementId);
      if (!replacement || replacement.group !== item.group || replacement.type !== item.type) {
        return { ...item, substitutionSourceId: item.id, substitutionSource: item };
      }

      return {
        ...replacement,
        prescription: item.prescription,
        prRole: item.prRole,
        substitutionSourceId: item.id,
        substitutionSource: item,
      };
    }),
  }));

  return {
    ...plan,
    sessions,
    weeklyVolume: calculateWeeklyVolume(sessions),
  };
}

export function nextSubstitution(plan, session, exerciseItem, substitutions = {}) {
  const key = substitutionKey(session, exerciseItem);
  const source = exerciseItem.substitutionSource ?? exerciseItem;
  const options = substitutionOptions(plan, exerciseItem);
  if (options.length <= 1) return { key, nextId: null, options };

  const currentId = substitutions[key] || exerciseItem.id;
  const index = Math.max(0, options.findIndex((item) => item.id === currentId));
  const next = options[(index + 1) % options.length];
  return {
    key,
    nextId: next.id === source.id ? null : next.id,
    options,
  };
}
