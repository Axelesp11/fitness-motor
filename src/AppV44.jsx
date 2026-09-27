import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import "./App.css";
import "./appV4.css";
import {
  ACTIVITY_LABELS,
  EQUIPMENT_LABELS,
  EXPERIENCE_LABELS,
  FOCUS_OPTIONS,
  buildPlan,
  calcNutrition,
  detectPR,
  formatRest,
  summarizeExerciseLog,
  warmupPlan,
} from "./engine.js";
import {
  PROGRAM_GOAL_LABELS,
  PR_LIFT_OPTIONS,
  SPLIT_OPTIONS,
  adaptTrainingPlan,
} from "./programming.js";
import { exerciseHistory, nextProgressionAdvice } from "./progression.js";
import { assessProgramFatigue, applyProgramFatigue } from "./programFatigue.js";
import { applyExerciseSubstitutions, substitutionKey, substitutionOptions } from "./substitution.js";
import {
  completeWorkout,
  createWorkoutSession,
  discardWorkoutLogs,
  formatDuration,
  sessionForWorkout,
  sessionProgress,
} from "./session.js";
import { loadState, parseImportedState, saveState, serializeState } from "./storage.js";
import { trainingAchievements } from "./achievements.js";

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const VIEWS = [
  ["hoy", "Hoy"], ["entrenar", "Entrenar"], ["progreso", "Progreso"], ["habitos", "Hábitos"],
];

function sessionRirLabel(session, fallback = "2") {
  const values = (session?.exercises ?? []).map((item) => Number(item.prescription?.rir)).filter(Number.isFinite);
  if (!values.length) return String(fallback);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? String(min) : `${min}–${max}`;
}

function Field({ label, hint, children }) {
  return <div className="field"><label>{label}</label>{children}{hint ? <small>{hint}</small> : null}</div>;
}

function RestTimer({ timer, onStart, onStop }) {
  const minutes = Math.floor(timer.remaining / 60);
  const seconds = timer.remaining % 60;
  const elapsed = timer.total ? Math.max(0, Math.min(1, 1 - timer.remaining / timer.total)) : 0;
  return (
    <div className={`rest-widget rest-widget-v4 ${timer.running ? "running" : ""}`} aria-live="polite">
      <div className="rest-v4-top">
        <div><span className="rest-label">DESCANSO</span><strong>{minutes}:{String(seconds).padStart(2, "0")}</strong></div>
        <div className="rest-ring" style={{ "--rest-deg": `${Math.round(elapsed * 360)}deg` }} aria-hidden="true"><i /></div>
      </div>
      <div className="rest-actions rest-presets">
        {[60, 90, 120, 180, 240, 300].map((value) => <button key={value} type="button" onClick={() => onStart(value)}>{value < 120 ? `${value}s` : `${value / 60}m`}</button>)}
        {timer.running ? <button className="rest-stop" type="button" onClick={onStop}>×</button> : null}
      </div>
    </div>
  );
}

function SettingsSheet({ open, onClose, state, updateProfile, exportData, importRef, importData, clearSubstitutions }) {
  const { profile, exerciseSubstitutions, activeWorkout } = state;
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="motor-settings-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
          <motion.section className="motor-settings-sheet" role="dialog" aria-modal="true" aria-labelledby="motor-settings-title" initial={{ y: 70, opacity: 0, scale: .97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 48, opacity: 0, scale: .98 }} transition={{ type: "spring", stiffness: 420, damping: 34 }}>
            <div className="motor-sheet-handle" />
            <div className="motor-settings-head"><div><span>MOTOR 4.4</span><h2 id="motor-settings-title">Configuración</h2></div><motion.button type="button" whileTap={{ scale: .9 }} onClick={onClose}>Listo</motion.button></div>
            {activeWorkout ? <div className="session-lock-note"><strong>Sesión congelada</strong><span>Termina o abandona el entrenamiento para cambiar la programación.</span></div> : null}
            <div className="motor-settings-grid">
              <Field label="OBJETIVO"><select className="control" disabled={Boolean(activeWorkout)} value={profile.objetivo} onChange={updateProfile("objetivo")}>{Object.entries(PROGRAM_GOAL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              {profile.objetivo === "pr" ? <Field label="LEVANTAMIENTO PR"><select className="control" disabled={Boolean(activeWorkout)} value={profile.prLift} onChange={updateProfile("prLift")}>{PR_LIFT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field> : null}
              <Field label="SPLIT / FRECUENCIA"><select className="control" disabled={Boolean(activeWorkout)} value={profile.dias} onChange={updateProfile("dias")}>{SPLIT_OPTIONS.map(([days, label]) => <option key={days} value={days}>{days} días · {label}</option>)}</select></Field>
              <Field label="EXPERIENCIA"><select className="control" disabled={Boolean(activeWorkout)} value={profile.experiencia} onChange={updateProfile("experiencia")}><option value="nunca">Principiante</option><option value="basico">Básico</option><option value="intermedio">Intermedio</option></select></Field>
              <Field label="EQUIPO"><select className="control" disabled={Boolean(activeWorkout)} value={profile.equipo} onChange={updateProfile("equipo")}>{Object.entries(EQUIPMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="DURACIÓN"><select className="control" disabled={Boolean(activeWorkout)} value={profile.duracion} onChange={updateProfile("duracion")}>{[45,60,75,90].map((value) => <option key={value} value={value}>{value} min</option>)}</select></Field>
              <Field label="ENFOQUE"><select className="control" disabled={Boolean(activeWorkout)} value={profile.enfoque} onChange={updateProfile("enfoque")}>{FOCUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="ACTIVIDAD"><select className="control" value={profile.actividad} onChange={updateProfile("actividad")}>{Object.entries(ACTIVITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            </div>
            <div className="motor-settings-separator"><span>Datos personales</span></div>
            <div className="motor-settings-grid compact">
              <Field label="PESO (KG)"><input className="control" type="number" min="35" max="250" step="0.1" value={profile.peso} onChange={updateProfile("peso")} /></Field>
              <Field label="ESTATURA (CM)"><input className="control" type="number" min="120" max="230" value={profile.estatura} onChange={updateProfile("estatura")} /></Field>
              <Field label="EDAD"><input className="control" type="number" min="18" max="90" value={profile.edad} onChange={updateProfile("edad")} /></Field>
              <Field label="SEXO"><select className="control" value={profile.sexo} onChange={updateProfile("sexo")}><option value="hombre">Hombre</option><option value="mujer">Mujer</option></select></Field>
            </div>
            <div className="motor-settings-separator"><span>Rutina y datos</span></div>
            <div className="data-actions motor-data-actions">
              <button className="secondary-btn" type="button" onClick={clearSubstitutions} disabled={Boolean(activeWorkout) || !Object.keys(exerciseSubstitutions).length}>Restablecer ejercicios</button>
              <button className="primary-btn" type="button" onClick={exportData}>Exportar datos</button>
              <button className="secondary-btn" type="button" onClick={() => importRef.current?.click()} disabled={Boolean(activeWorkout)}>Importar respaldo</button>
              <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importData} />
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function AppV44() {
  const [state, setState] = useState(() => loadState());
  const [activeDay, setActiveDay] = useState(() => state.activeWorkout?.sessionIndex ?? 0);
  const [view, setView] = useState("hoy");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [drafts, setDrafts] = useState({});
  const [bodyDraft, setBodyDraft] = useState({ date: localDate(), weight: state.profile.peso, calories: "", sleepHours: "" });
  const [notice, setNotice] = useState("");
  const [timer, setTimer] = useState({ remaining: 0, total: 0, running: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [abandonArmed, setAbandonArmed] = useState(false);
  const importRef = useRef(null);

  const { profile, readiness, exerciseLogs, bodyLogs, sessionCompletions, activeWorkout, exerciseSubstitutions } = state;
  const achievements = useMemo(() => trainingAchievements({ sessionCompletions, exerciseLogs, bodyLogs }), [sessionCompletions, exerciseLogs, bodyLogs]);
  const nutrition = useMemo(() => calcNutrition(profile, bodyLogs), [profile, bodyLogs]);
  const performanceFatigue = useMemo(() => assessProgramFatigue(exerciseLogs), [exerciseLogs]);
  const unswappedPlan = useMemo(() => {
    const programmed = adaptTrainingPlan(buildPlan(profile, readiness, sessionCompletions), profile);
    return applyProgramFatigue(programmed, performanceFatigue);
  }, [profile, readiness, sessionCompletions, performanceFatigue]);
  const plan = useMemo(() => applyExerciseSubstitutions(unswappedPlan, exerciseSubstitutions), [unswappedPlan, exerciseSubstitutions]);
  const plannedSession = plan.sessions[activeDay] ?? plan.sessions[0];
  const session = sessionForWorkout(activeWorkout, plannedSession);
  const progress = useMemo(() => sessionProgress(session, exerciseLogs, sessionCompletions, activeWorkout), [session, exerciseLogs, sessionCompletions, activeWorkout]);
  const historicalLogs = useMemo(() => activeWorkout ? exerciseLogs.filter((log) => log.sessionId !== activeWorkout.id) : exerciseLogs, [exerciseLogs, activeWorkout]);
  const currentRir = activeWorkout?.planContext?.targetRir || sessionRirLabel(session, plan.programming?.targetRir);
  const currentFatigue = activeWorkout?.planContext?.fatigueStatus || performanceFatigue.label;
  const exerciseNames = useMemo(() => [...new Map([...exerciseLogs].reverse().map((log) => [log.exerciseId, log.exerciseName])).entries()], [exerciseLogs]);
  const progressExercise = selectedExercise && exerciseNames.some(([id]) => id === selectedExercise) ? selectedExercise : exerciseNames[0]?.[0];
  const progressHistory = useMemo(() => exerciseLogs.filter((log) => log.exerciseId === progressExercise).slice(-12).map((log) => ({
    id: log.id,
    date: new Date(log.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
    value: summarizeExerciseLog(log).bestE1RM,
    reps: summarizeExerciseLog(log).avgReps,
    sets: log.sets.length,
  })), [exerciseLogs, progressExercise]);
  const usableProgress = progressHistory.filter((item) => item.value != null);
  const recentHabits = [...bodyLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const averageOf = (key) => {
    const values = recentHabits.map((item) => item[key]).filter((value) => Number.isFinite(value) && value > 0);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * (key === "sleepHours" ? 10 : 1)) / (key === "sleepHours" ? 10 : 1) : null;
  };
  const averageSleep = averageOf("sleepHours");
  const averageCalories = averageOf("calories");

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    const navigate = (event) => { if (VIEWS.some(([id]) => id === event.detail)) { setView(event.detail); window.scrollTo({ top: 0, behavior: "smooth" }); } };
    window.addEventListener("fitness:navigate", navigate);
    return () => window.removeEventListener("fitness:navigate", navigate);
  }, []);
  useEffect(() => { if (!activeWorkout && activeDay >= plan.sessions.length) setActiveDay(0); }, [activeDay, activeWorkout, plan.sessions.length]);
  useEffect(() => {
    const open = () => setSettingsOpen(true);
    window.addEventListener("fitness:open-motor-settings", open);
    return () => window.removeEventListener("fitness:open-motor-settings", open);
  }, []);
  useEffect(() => {
    if (!timer.running) return undefined;
    const id = window.setInterval(() => setTimer((current) => {
      if (current.remaining <= 1) {
        setNotice("Descanso terminado.");
        return { remaining: 0, total: 0, running: false };
      }
      return { ...current, remaining: current.remaining - 1 };
    }), 1000);
    return () => window.clearInterval(id);
  }, [timer.running]);
  useEffect(() => {
    if (!activeWorkout) return undefined;
    const id = window.setInterval(() => setClockTick((value) => value + 1), 30000);
    return () => window.clearInterval(id);
  }, [activeWorkout]);
  useEffect(() => {
    if (!notice) return undefined;
    const id = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    if (!abandonArmed) return undefined;
    const id = window.setTimeout(() => setAbandonArmed(false), 4500);
    return () => window.clearTimeout(id);
  }, [abandonArmed]);

  const updateProfile = (key) => (event) => {
    const lockedProgrammingKeys = ["objetivo", "prLift", "dias", "experiencia", "equipo", "duracion", "enfoque"];
    if (activeWorkout && lockedProgrammingKeys.includes(key)) {
      setNotice("La sesión activa está congelada. Cambia la programación al terminar.");
      return;
    }
    const numeric = ["peso", "estatura", "edad", "dias", "duracion"].includes(key);
    const value = numeric ? Number(event.target.value) : event.target.value;
    setState((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
  };

  const updateReadiness = (key) => (event) => {
    if (activeWorkout) {
      setNotice("La recuperación se evalúa antes de iniciar. Esta sesión conserva su prescripción original.");
      return;
    }
    setState((current) => ({ ...current, readiness: { ...current.readiness, [key]: Number(event.target.value) } }));
  };

  const updateSetDraft = (draftKey, setIndex, field, value) => setDrafts((current) => {
    const nextSets = [...(current[draftKey] ?? [])];
    nextSets[setIndex] = { ...(nextSets[setIndex] ?? {}), [field]: value };
    return { ...current, [draftKey]: nextSets };
  });

  const startRest = (seconds) => setTimer({ remaining: seconds, total: seconds, running: true });
  const stopRest = () => setTimer({ remaining: 0, total: 0, running: false });

  const startWorkout = () => {
    setView("entrenar");
    if (activeWorkout) {
      if (activeWorkout.sessionLabel !== session.label) setNotice(`Ya hay una sesión activa: ${activeWorkout.sessionLabel}.`);
      document.querySelector(".routine-card")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const workout = createWorkoutSession(plannedSession, activeDay, uid, new Date(), {
      objective: profile.objetivo,
      week: plan.mesocycle.week,
      targetRir: sessionRirLabel(plannedSession, plan.programming?.targetRir),
      fatigueStatus: performanceFatigue.label,
    });
    setState((current) => ({ ...current, activeWorkout: workout }));
    setNotice(`Sesión congelada e iniciada · ${plannedSession.label}.`);
    window.setTimeout(() => document.querySelector(".routine-card")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const changeDay = (index) => {
    if (activeWorkout && activeWorkout.sessionIndex !== index) {
      setNotice(`Finaliza o abandona ${activeWorkout.sessionLabel} antes de cambiar de día.`);
      return;
    }
    setActiveDay(index);
    setView("entrenar");
  };

  const saveExercise = (exerciseItem) => {
    if (!activeWorkout || activeWorkout.sessionLabel !== session.label) {
      setNotice("Inicia esta sesión antes de registrar series.");
      return;
    }
    const draftKey = `${session.label}|${exerciseItem.id}`;
    const advice = nextProgressionAdvice(exerciseItem, historicalLogs, profile);
    const rawSets = drafts[draftKey] ?? [];
    const sets = Array.from({ length: exerciseItem.prescription.sets }, (_, index) => {
      const raw = rawSets[index] ?? {};
      const defaultWeight = advice.nextWeight ?? 0;
      const weight = raw.weight === "" || raw.weight == null ? defaultWeight : Number(raw.weight);
      const reps = Number(raw.reps);
      const rir = raw.rir === "" || raw.rir == null ? exerciseItem.prescription.rir : Number(raw.rir);
      return { weight: Number.isFinite(weight) ? Math.max(0, weight) : 0, reps, rir };
    }).filter((set) => Number.isFinite(set.reps) && set.reps > 0 && Number.isFinite(set.rir));

    if (!sets.length) {
      setNotice("Registra al menos una serie con repeticiones.");
      return;
    }

    const logsBefore = exerciseLogs.filter((log) => !(log.sessionId === activeWorkout.id && log.exerciseId === exerciseItem.id));
    const newLog = {
      id: uid(),
      sessionId: activeWorkout.id,
      createdAt: new Date().toISOString(),
      sessionLabel: session.label,
      exerciseId: exerciseItem.id,
      exerciseName: exerciseItem.name,
      sets,
    };
    const pr = detectPR(logsBefore, newLog);
    setState((current) => ({
      ...current,
      exerciseLogs: [...current.exerciseLogs.filter((log) => !(log.sessionId === activeWorkout.id && log.exerciseId === exerciseItem.id)), newLog].slice(-1500),
    }));
    setDrafts((current) => ({ ...current, [draftKey]: [] }));
    if (pr.e1rmPR) setNotice(`Nuevo PR estimado · ${exerciseItem.name}.`);
    else if (pr.volumePR) setNotice(`Récord de volumen · ${exerciseItem.name}.`);
    else setNotice(`${exerciseItem.name} guardado.`);
  };

  const finishWorkout = () => {
    if (!activeWorkout) {
      setNotice("No hay una sesión activa.");
      return;
    }
    const current = sessionProgress(session, exerciseLogs, sessionCompletions, activeWorkout);
    if (!current.canFinish) {
      setNotice(`Completa al menos ${current.minimumToFinish} de ${current.planned} ejercicios antes de finalizar.`);
      return;
    }
    const completion = completeWorkout(activeWorkout, current, new Date(), uid);
    const nextAchievements = trainingAchievements({ sessionCompletions: [...sessionCompletions, completion], exerciseLogs, bodyLogs });
    setState((currentState) => ({
      ...currentState,
      activeWorkout: null,
      sessionCompletions: [...currentState.sessionCompletions, completion].slice(-700),
    }));
    setDrafts({});
    stopRest();
    setActiveDay((value) => (value + 1) % plan.sessions.length);
    setView("progreso");
    const newRank = nextAchievements.tier > achievements.tier ? ` ¡Nuevo rango: ${nextAchievements.rank.name}!` : "";
    setNotice(`Sesión terminada · ${current.percent}% · ${formatDuration(completion.durationSec)}.${newRank}`);
  };

  const abandonWorkout = () => {
    if (!activeWorkout) return;
    if (!abandonArmed) {
      setAbandonArmed(true);
      setNotice("Pulsa otra vez «Confirmar abandono» para descartar los registros de esta sesión.");
      return;
    }
    const label = activeWorkout.sessionLabel;
    setState((current) => ({
      ...current,
      exerciseLogs: discardWorkoutLogs(current.exerciseLogs, current.activeWorkout),
      activeWorkout: null,
    }));
    setDrafts({});
    stopRest();
    setAbandonArmed(false);
    setNotice(`Sesión abandonada · ${label}. No se añadió al historial.`);
  };

  const setSubstitution = (sessionItem, exerciseItem, replacementId) => {
    if (activeWorkout) {
      setNotice("No cambies ejercicios con una sesión activa. Finalízala primero.");
      return;
    }
    const key = substitutionKey(sessionItem, exerciseItem);
    const sourceId = exerciseItem.substitutionSourceId || exerciseItem.id;
    setState((current) => {
      const next = { ...current.exerciseSubstitutions };
      if (!replacementId || replacementId === sourceId) delete next[key];
      else next[key] = replacementId;
      return { ...current, exerciseSubstitutions: next };
    });
  };

  const saveBodyCheckin = () => {
    const weight = Number(bodyDraft.weight);
    const calories = Number(bodyDraft.calories);
    const sleepHours = bodyDraft.sleepHours === "" ? null : Number(bodyDraft.sleepHours);
    if (!bodyDraft.date || !Number.isFinite(weight) || weight <= 0) {
      setNotice("Revisa la fecha y el peso del check-in.");
      return;
    }
    if (sleepHours != null && (!Number.isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24)) {
      setNotice("Revisa las horas de sueño: deben estar entre 0 y 24.");
      return;
    }
    const entry = { id: uid(), date: bodyDraft.date, weight, calories: Number.isFinite(calories) && calories > 0 ? Math.round(calories) : null, sleepHours };
    setState((current) => ({
      ...current,
      profile: { ...current.profile, peso: weight },
      bodyLogs: [...current.bodyLogs.filter((item) => item.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-365),
    }));
    setNotice(activeWorkout ? "Día guardado. La sesión activa no cambió." : "Día guardado correctamente.");
  };

  const exportData = () => {
    const blob = new Blob([serializeState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fitness-motor-backup-${localDate()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (activeWorkout) {
      setNotice("Finaliza o abandona la sesión antes de importar un respaldo.");
      return;
    }
    try {
      const imported = parseImportedState(await file.text());
      setState(imported);
      setActiveDay(imported.activeWorkout?.sessionIndex ?? 0);
      setBodyDraft({ date: localDate(), weight: imported.profile.peso, calories: "", sleepHours: "" });
      setNotice("Respaldo importado correctamente.");
    } catch (error) {
      setNotice(error.message || "No se pudo importar el respaldo.");
    }
  };

  const activeElapsed = activeWorkout ? Math.max(0, Math.round((Date.now() - new Date(activeWorkout.startedAt).getTime()) / 1000)) : 0;
  void clockTick;
  const expenditureLabel = nutrition.expenditure.source === "adaptive" ? `Adaptativo · ${Math.round(nutrition.expenditure.confidence * 100)}%` : nutrition.expenditure.source === "blended" ? `Mixto · ${Math.round(nutrition.expenditure.confidence * 100)}%` : "Fórmula inicial";
  const trendText = nutrition.trend.weeklyChangePct == null ? "Sin tendencia suficiente" : `${nutrition.trend.weeklyChangeKg > 0 ? "+" : ""}${nutrition.trend.weeklyChangeKg} kg/sem`;

  return (
    <main className={`app-shell app-v4 goal-${profile.objetivo} view-${view}`}>
      <div className="container">
        <nav className="motor-view-nav" aria-label="Secciones de Fitness Motor">{VIEWS.map(([id, label]) => <button key={id} type="button" aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}>{label}</button>)}<button type="button" className="motor-nav-settings" onClick={() => setSettingsOpen(true)}>Ajustes</button></nav>
        {(view === "progreso" || view === "habitos") && <button className="mobile-settings" type="button" onClick={() => setSettingsOpen(true)}>Configurar entrenamiento</button>}
        {(view === "hoy" || view === "entrenar") && <>
        <header className="header v4-hero">
          <div className="v4-hero-copy">
            <div className="hero-topline"><p className="eyebrow">MOTOR FITNESS 4.4</p><button className="appearance-trigger" type="button" onClick={() => window.dispatchEvent(new Event("fitness:open-appearance"))} aria-label="Personalizar colores y animaciones"><span className="appearance-orbit" aria-hidden="true" />Personalizar diseño</button></div>
            <div className="v4-status-row"><span>{PROGRAM_GOAL_LABELS[activeWorkout?.planContext?.objective || profile.objetivo]}</span><span>{EXPERIENCE_LABELS[profile.experiencia]}</span><span>Semana {activeWorkout?.planContext?.week || plan.mesocycle.week}/6</span><span className="rank-status">Rango {achievements.rank.name}</span></div>
            <div className="hero-title-block"><span className="hero-index">{String(activeDay + 1).padStart(2, "0")} / {String(plan.sessions.length).padStart(2, "0")}</span><h1>{session.label}</h1></div>
            <p className="subtitle">{activeWorkout ? "Tu sesión está en marcha. Registra cada serie y sigue tu ritmo." : "Tu entrenamiento está listo. Ajusta tu recuperación antes de empezar."}</p>
            <div className="v4-hero-actions">
              <motion.button className="primary-btn" type="button" whileHover={{ y: -2 }} whileTap={{ scale: .96 }} onClick={startWorkout}>{activeWorkout ? `Ver sesión · ${formatDuration(activeElapsed)}` : "Iniciar entrenamiento"}<span aria-hidden="true"> ↗</span></motion.button>
              <motion.button className="secondary-btn settings-launch" type="button" whileTap={{ scale: .96 }} onClick={() => setSettingsOpen(true)}>Configurar motor</motion.button>
            </div>
          </div>
          {view === "entrenar" ? <RestTimer timer={timer} onStart={startRest} onStop={stopRest} /> : null}
        </header>
        </>}

        {notice ? <div className="toast" role="status">{notice}</div> : null}

        {view === "hoy" && <>
        <motion.section className={`card rank-card rank-${achievements.rank.tone}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 190, damping: 22 }} aria-label={`Rango actual: ${achievements.rank.name}`}>
          <div className="rank-emblem" aria-hidden="true"><span>{String(achievements.tier).padStart(2, "0")}</span></div>
          <div className="rank-content"><span className="rank-kicker">TU CAMINO · RANGO {achievements.tier}</span><h2>{achievements.rank.name}</h2><p>{achievements.sessions === 0 ? "Tu primera sesión te lleva a Principiante." : achievements.nextRank ? `${achievements.remaining} ${achievements.remaining === 1 ? "sesión" : "sesiones"} para ${achievements.nextRank.name}.` : "Has alcanzado el rango más alto."}</p><div className="rank-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={achievements.progress} aria-label={achievements.nextRank ? `Progreso hacia ${achievements.nextRank.name}` : "Rango máximo"}><motion.i initial={{ width: 0 }} animate={{ width: `${achievements.progress}%` }} transition={{ duration: .8, ease: "easeOut" }} /></div><small>{achievements.sessions} sesiones completas · {achievements.unlocked} de {achievements.milestones.length} logros</small></div>
          <button type="button" className="rank-link" onClick={() => setView("progreso")}>Ver logros <span aria-hidden="true">↗</span></button>
        </motion.section>
        <section className="card session-overview">
          <div className="section-heading"><h2 className="section-title">SESIÓN ACTUAL</h2><span>{progress.completed}/{progress.planned} ejercicios</span></div>
          <div className="session-progress-track"><motion.i animate={{ width: `${progress.percent}%` }} transition={{ type: "spring", stiffness: 260, damping: 30 }} /></div>
          <div className="session-overview-row">
            <div><span>Estado</span><strong>{activeWorkout ? `Congelada · ${formatDuration(activeElapsed)}` : "Sin iniciar"}</strong></div>
            <div><span>RIR sesión</span><strong>{currentRir}</strong></div>
            <div><span>Fatiga al inicio</span><strong>{currentFatigue}</strong></div>
          </div>
        </section>
        <section className="card day-picker"><div className="section-heading"><h2 className="section-title">ELIGE TU DÍA</h2><span>{plan.sessions.length} entrenamientos</span></div><div className="day-picker-grid">{plan.sessions.map((item, index) => <button key={`${item.label}-${index}`} type="button" className={index === activeDay ? "selected" : ""} aria-pressed={index === activeDay} onClick={() => changeDay(index)}><span>DÍA {String(index + 1).padStart(2, "0")}</span><strong>{item.label.replace(/^Día \d+ · /, "")}</strong><small>{item.exercises.length} ejercicios · {profile.duracion} min</small></button>)}</div></section>
        <div className="home-summary"><button type="button" className="card summary-action" onClick={() => setView("progreso")}><span>MI PROGRESO</span><strong>{sessionCompletions.length} sesiones terminadas</strong><small>Ver historial y evolución ↗</small></button><button type="button" className="card summary-action" onClick={() => setView("habitos")}><span>DESCANSO Y COMIDA</span><strong>{averageSleep != null ? `${averageSleep} h de sueño` : "Registra tu descanso"}</strong><small>{averageCalories != null ? `${averageCalories} kcal/día registradas` : "Añade tus calorías diarias"} ↗</small></button></div>
        </>}

        {view === "entrenar" && <>
        <div className="v4-main-grid">
          <section className="stack">
            <section className="card routine-card">
              <div className="section-heading"><h2 className="section-title">ENTRENAMIENTO</h2><span>{profile.duracion} min · {EQUIPMENT_LABELS[profile.equipo]}</span></div>
              <div className="session-tabs" role="tablist" aria-label="Días de entrenamiento">{plan.sessions.map((item, index) => <motion.button key={`${item.label}-${index}`} type="button" role="tab" aria-selected={index === activeDay} className={`tab ${index === activeDay ? "active" : ""}`} whileTap={{ scale: .94 }} onClick={() => changeDay(index)}>Día {index + 1}</motion.button>)}</div>
              <div className="session-head"><div><h2>{session.label}</h2><span>{activeWorkout ? `Prescripción congelada · mínimo ${progress.minimumToFinish} ejercicios para cerrar` : "Evalúa recuperación e inicia para congelar la prescripción"}</span></div><div className="session-head-actions">{activeWorkout ? <button className={`secondary-btn abandon-btn ${abandonArmed ? "armed" : ""}`} type="button" onClick={abandonWorkout}>{abandonArmed ? "Confirmar abandono" : "Abandonar"}</button> : null}<button className="secondary-btn" type="button" onClick={finishWorkout} disabled={!activeWorkout}>Finalizar</button></div></div>

              <div className="exercise-list">
                {session.exercises.map((exerciseItem, exerciseIndex) => {
                  const history = exerciseHistory(historicalLogs, exerciseItem.id, 4);
                  const previous = history.at(-1);
                  const previousSummary = previous ? summarizeExerciseLog(previous) : null;
                  const advice = nextProgressionAdvice(exerciseItem, historicalLogs, profile);
                  const p = exerciseItem.prescription;
                  const draftKey = `${session.label}|${exerciseItem.id}`;
                  const exerciseDraft = drafts[draftKey] ?? [];
                  const warmups = exerciseItem.type === "compound" && advice.nextWeight ? warmupPlan(advice.nextWeight, exerciseItem.increment) : [];
                  const source = exerciseItem.substitutionSource ?? exerciseItem;
                  const options = substitutionOptions(unswappedPlan, source);
                  const isLockedPr = Boolean(exerciseItem.prRole);

                  return (
                    <motion.article className="exercise" key={`${exerciseItem.substitutionSourceId || exerciseItem.id}-${exerciseItem.id}`} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: .32, delay: Math.min(exerciseIndex * .035, .18) }}>
                      <div className="exercise-top">
                        <div><div className="exercise-name">{exerciseItem.name}</div><div className="exercise-group">{exerciseItem.group} · {exerciseItem.type === "compound" ? "Compuesto" : "Aislamiento"}{exerciseItem.prRole ? ` · PR ${exerciseItem.prRole === "primary" ? "principal" : "técnico"}` : ""}</div><div className={`progression-badge progression-${advice.status}`}>{advice.badge}{advice.trend?.label && advice.trend.status !== "new" ? ` · ${advice.trend.label}` : ""}</div></div>
                        <div className="prescription-block"><div className="prescription">{p.sets} × {p.min}-{p.max} · RIR {p.rir}</div><div className="exercise-meta">{p.intent}</div><button className="timer-btn" type="button" onClick={() => startRest(p.rest)}>Descanso {formatRest(p.rest)}</button></div>
                      </div>
                      {!activeWorkout && !isLockedPr && options.length > 1 ? <div className="warmup"><span>Sustitución</span><select className="control" value={exerciseItem.id} onChange={(event) => setSubstitution(session, exerciseItem, event.target.value)}>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></div> : null}
                      {warmups.length ? <div className="warmup"><span>Calentamiento</span>{warmups.map((item, index) => <b key={`${item.weight}-${index}`}>{item.weight}kg × {item.reps}</b>)}</div> : null}
                      <div className="sets-table"><div className="set-row set-head"><span>Serie</span><span>{exerciseItem.loadType === "bodyweight" ? "Lastre" : "Kg"}</span><span>Reps</span><span>RIR</span></div>{Array.from({ length: p.sets }, (_, setIndex) => { const raw = exerciseDraft[setIndex] ?? {}; return <div className="set-row" key={setIndex}><strong>{setIndex + 1}</strong><input aria-label={`${exerciseItem.name} serie ${setIndex + 1} carga`} className="log-input" type="number" min="0" step="0.5" placeholder={advice.nextWeight ?? "0"} value={raw.weight ?? ""} onChange={(event) => updateSetDraft(draftKey, setIndex, "weight", event.target.value)} /><input aria-label={`${exerciseItem.name} serie ${setIndex + 1} repeticiones`} className="log-input" type="number" min="1" max="50" placeholder={`${p.min}-${p.max}`} value={raw.reps ?? ""} onChange={(event) => updateSetDraft(draftKey, setIndex, "reps", event.target.value)} /><input aria-label={`${exerciseItem.name} serie ${setIndex + 1} RIR`} className="log-input" type="number" min="0" max="8" placeholder={p.rir} value={raw.rir ?? ""} onChange={(event) => updateSetDraft(draftKey, setIndex, "rir", event.target.value)} /></div>; })}</div>
                      <div className="exercise-footer"><div className="advice"><span>{previous ? `Último · ${previous.sets.length} series${previousSummary?.bestE1RM ? ` · e1RM ${previousSummary.bestE1RM} kg` : ""}` : "Primera exposición"}</span><strong>{advice.action}</strong></div><motion.button className="save-btn" type="button" whileTap={{ scale: .96 }} onClick={() => saveExercise(exerciseItem)} disabled={!activeWorkout}>Guardar ejercicio</motion.button></div>
                    </motion.article>
                  );
                })}
              </div>
            </section>

            <section className="card recovery-card">
              <div className="section-heading"><h2 className="section-title">AUTORREGULACIÓN</h2><span>{activeWorkout ? "bloqueada para esta sesión" : `${plan.readiness.score}/15 subjetivo`}</span></div>
              <div className="readiness-grid">{[["energia","ENERGÍA","1 baja · 5 alta"],["sueno","SUEÑO","1 malo · 5 bueno"],["dolor","AGUJETAS","1 bajas · 5 altas"]].map(([key,label,hint]) => <Field key={key} label={label} hint={activeWorkout ? "Congelado hasta terminar" : hint}><div className="range-line"><input aria-label={label} type="range" min="1" max="5" disabled={Boolean(activeWorkout)} value={readiness[key]} onChange={updateReadiness(key)} /><span>{readiness[key]}</span></div></Field>)}</div>
              <div className={`readiness-status status-${performanceFatigue.status}`}><div><span>Subjetivo</span><strong>{activeWorkout ? "Snapshot" : plan.readiness.label}</strong></div><div><span>Próxima sesión</span><strong>{performanceFatigue.label}</strong></div><div><span>RIR actual</span><strong>{currentRir}</strong></div></div>
              <p className="body-copy">{activeWorkout ? "La autorregulación nueva se calcula en segundo plano y solo se aplicará cuando inicies la próxima sesión." : performanceFatigue.message}</p>
            </section>
          </section>

          <aside className="v4-side-stack">
            <section className="card day-guide"><div className="section-heading"><h2 className="section-title">CAMBIAR DÍA</h2></div><div className="day-guide-list">{plan.sessions.map((item, index) => <button key={`${item.label}-${index}`} className={index === activeDay ? "selected" : ""} type="button" aria-pressed={index === activeDay} onClick={() => changeDay(index)}>{index + 1}. {item.label.replace(/^Día \d+ · /, "")}</button>)}</div></section>
            <details className="card program-details"><summary><span>PROGRAMACIÓN SIGUIENTE</span><strong>{plan.programming.title}</strong></summary><p className="body-copy">{plan.programming.summary}</p><div className="program-mini-grid"><div><span>Principales</span><strong>{plan.programming.primaryRange}</strong></div><div><span>Accesorios</span><strong>{plan.programming.accessoryRange}</strong></div><div><span>Descanso</span><strong>{plan.programming.rest}</strong></div></div><p className="body-copy"><strong>Split:</strong> {plan.programming.splitNote}</p>{plan.programming.warning ? <div className="empty compact">{plan.programming.warning}</div> : null}</details>
          </aside>
        </div>

        </>}

        {view === "habitos" && <div className="habits-layout"><div className="habits-intro"><p className="eyebrow">HÁBITOS</p><h1>Sueño, comida y peso</h1><p>Registra datos diarios para entender mejor el contexto de tus entrenamientos.</p></div><div className="v4-side-stack">
            <section className="card nutrition-card"><div className="section-heading"><h2 className="section-title">COMBUSTIBLE</h2><span>{expenditureLabel}</span></div><div className="metrics compact-metrics"><div className="metric"><div className="metric-label">GASTO</div><div className="metric-value">{nutrition.expenditure.expenditure}</div><div className="metric-unit">kcal/día</div></div><div className="metric metric-accent"><div className="metric-label">META</div><div className="metric-value">{nutrition.target}</div><div className="metric-unit">kcal/día</div></div></div><div className="macro-row compact-macros"><div className="macro"><span>PROTEÍNA</span><strong>{nutrition.macros.protein} g</strong></div><div className="macro"><span>CARBOS</span><strong>{nutrition.macros.carbs} g</strong></div><div className="macro"><span>GRASAS</span><strong>{nutrition.macros.fat} g</strong></div></div></section>
            <section className="card body-card"><div className="section-heading"><h2 className="section-title">REGISTRO DEL DÍA</h2><span>{trendText}</span></div><div className="body-checkin compact-checkin"><Field label="FECHA"><input className="control" type="date" value={bodyDraft.date} onChange={(event) => setBodyDraft((current) => ({ ...current, date: event.target.value }))} /></Field><Field label="PESO ACTUAL (KG)"><input className="control" type="number" step="0.1" value={bodyDraft.weight} onChange={(event) => setBodyDraft((current) => ({ ...current, weight: event.target.value }))} /></Field><Field label="HORAS DE SUEÑO" hint="Opcional · de anoche"><input className="control" type="number" min="0" max="24" step="0.5" placeholder="Ej. 7.5" value={bodyDraft.sleepHours} onChange={(event) => setBodyDraft((current) => ({ ...current, sleepHours: event.target.value }))} /></Field><Field label="CALORÍAS CONSUMIDAS" hint="Opcional"><input className="control" type="number" min="0" placeholder="Ej. 2400" value={bodyDraft.calories} onChange={(event) => setBodyDraft((current) => ({ ...current, calories: event.target.value }))} /></Field></div><button className="primary-btn full-btn" type="button" onClick={saveBodyCheckin}>Guardar día</button></section>
            <section className="card volume-card"><div className="section-heading"><h2 className="section-title">VOLUMEN SEMANAL</h2><span>próxima prescripción</span></div><div className="volume-grid">{Object.entries(plan.weeklyVolume).filter(([, value]) => value > 0).map(([muscle, value]) => <div className="volume-chip" key={muscle}><span>{muscle}</span><strong>{value}</strong></div>)}</div></section>
          </div><div className="habits-results"><div className="habit-stats"><div className="card"><span>SUEÑO PROMEDIO</span><strong>{averageSleep != null ? `${averageSleep} h` : "Sin datos"}</strong></div><div className="card"><span>CALORÍAS PROMEDIO</span><strong>{averageCalories != null ? `${averageCalories} kcal` : "Sin datos"}</strong></div><div className="card"><span>DÍAS REGISTRADOS</span><strong>{bodyLogs.length}</strong></div></div><section className="card"><div className="section-heading"><h2 className="section-title">DÍAS REGISTRADOS</h2></div>{recentHabits.length ? recentHabits.map((item) => <div className="history-row" key={item.id}><div><strong>{item.date}</strong><span>{item.weight} kg · {item.sleepHours != null ? `${item.sleepHours} h de sueño` : "Sueño sin registrar"}</span></div><div className="history-stats"><b>{item.calories != null ? `${item.calories} kcal` : "Sin calorías"}</b></div></div>) : <div className="empty">Guarda tu primer día para ver aquí sueño, comida y peso.</div>}</section><p className="habits-note">Estos datos ayudan a interpretar tu rendimiento. No calculan cuántos kilos de músculo ganaste ni prueban que una noche de sueño causó un cambio.</p></div></div>}

        {view === "progreso" && <div className="progress-page">
          <div className="habits-intro"><p className="eyebrow">PROGRESO</p><h1>Tu entrenamiento en números</h1><p>Series, cargas y sesiones que realmente registraste.</p></div>
          <section className="card achievements-gallery"><div className="section-heading"><h2 className="section-title">TUS LOGROS</h2><span>{achievements.unlocked} de {achievements.milestones.length} desbloqueados</span></div><div className="achievement-rank-line"><span className={`mini-rank rank-${achievements.rank.tone}`}>{achievements.tier}</span><div><strong>{achievements.rank.name}</strong><small>{achievements.nextRank ? `Siguiente: ${achievements.nextRank.name} · faltan ${achievements.remaining} sesiones` : "Rango máximo alcanzado"}</small></div></div><div className="achievement-grid">{[...achievements.milestones].sort((a, b) => Number(b.unlocked) - Number(a.unlocked)).map((item) => <article key={item.id} className={`achievement-item ${item.unlocked ? "unlocked" : "locked"}`}><div className="achievement-icon" aria-hidden="true">{item.icon}</div><div><strong>{item.name}</strong><p>{item.detail}</p><span>{item.unlocked ? "Desbloqueado" : `${item.current} / ${item.target}`}</span></div></article>)}</div><p className="habits-note">Los rangos reconocen sesiones terminadas. Registrar sueño y comida da logros de seguimiento, sin premiar una cantidad de calorías o de horas.</p></section>
          <div className="progress-highlights"><div className="card"><span>SESIONES TERMINADAS</span><strong>{sessionCompletions.length}</strong></div><div className="card"><span>EJERCICIOS REGISTRADOS</span><strong>{exerciseLogs.length}</strong></div><div className="card"><span>PESO ACTUAL</span><strong>{bodyLogs.length ? `${bodyLogs.at(-1).weight} kg` : "Sin registro"}</strong></div></div>
          <section className="card progress-chart"><div className="section-heading"><h2 className="section-title">EVOLUCIÓN POR EJERCICIO</h2><span>Últimos 12 registros</span></div>{exerciseNames.length ? <><label htmlFor="progress-exercise">Elige un ejercicio</label><select id="progress-exercise" className="control" value={progressExercise} onChange={(event) => setSelectedExercise(event.target.value)}>{exerciseNames.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><div className="progress-bars" aria-label="Evolución de fuerza estimada">{progressHistory.map((item) => <div key={item.id} className="progress-bar-item"><div className="progress-bar-track"><i style={{ height: `${item.value != null && usableProgress.length ? Math.max(12, Math.round(item.value / Math.max(...usableProgress.map((entry) => entry.value)) * 100)) : 12}%` }} /></div><strong>{item.value != null ? `${item.value} kg` : `${item.reps} reps`}</strong><span>{item.date}</span></div>)}</div><p className="habits-note">e1RM estima fuerza a partir de tus series; no mide masa muscular.</p></> : <div className="empty">Guarda series durante una sesión para ver aquí tus cargas y repeticiones.</div>}</section>
        <section className="card context-card"><div className="section-heading"><h2 className="section-title">ENTRENA Y RECUPÉRATE</h2></div><p>Últimos {recentHabits.length} días registrados: {averageSleep != null ? `${averageSleep} h de sueño en promedio` : "faltan horas de sueño"} · {averageCalories != null ? `${averageCalories} kcal consumidas en promedio` : "faltan calorías consumidas"}.</p><p>{usableProgress.length >= 2 ? `En ${exerciseNames.find(([id]) => id === progressExercise)?.[1]}, tu fuerza estimada pasó de ${usableProgress[0].value} a ${usableProgress.at(-1).value} kg entre los registros mostrados.` : "Registra varias sesiones del mismo ejercicio para comparar tu rendimiento."}</p><p className="habits-note">Es una comparación de tus registros, no una medición de músculo ganado ni una relación causal con el sueño o la comida.</p><button className="secondary-btn" type="button" onClick={() => setView("habitos")}>Registrar sueño y comida</button></section>
        <section className="card history history-card">
          <div className="section-heading"><h2 className="section-title">SESIONES RECIENTES</h2><span>{sessionCompletions.length} cerradas</span></div>
          {sessionCompletions.length ? <div className="history-v4-list">{[...sessionCompletions].reverse().map((item) => <div className="history-row" key={item.id}><div><strong>{item.sessionLabel}</strong><span>{item.startedAt ? new Date(item.startedAt).toLocaleString() : new Date(item.createdAt).toLocaleString()}</span></div><div className="history-stats"><b>{item.plannedExercises ? `${item.completionPct}%` : "Histórico"}</b><span>{item.durationSec ? formatDuration(item.durationSec) : "Sin duración registrada"}</span></div></div>)}</div> : <div className="empty">Finaliza tu primera sesión para construir historial real de duración y cumplimiento.</div>}
        </section>
        <details className="card history history-card"><summary>Ver todas las series registradas ({exerciseLogs.length})</summary>{exerciseLogs.length ? <div className="history-v4-list">{[...exerciseLogs].reverse().map((log) => { const summary = summarizeExerciseLog(log); return <div className="history-row" key={log.id}><div><strong>{log.exerciseName}</strong><span>{new Date(log.createdAt).toLocaleDateString("es-MX")} · {log.sessionLabel}</span></div><div className="history-stats"><b>{log.sets.length} series</b><span>{summary.bestE1RM ? `e1RM ${summary.bestE1RM} kg` : `${summary.avgReps} reps prom.`}</span></div></div>; })}</div> : <div className="empty">Todavía no hay series registradas.</div>}</details>
        </div>}
      </div>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} state={state} updateProfile={updateProfile} exportData={exportData} importRef={importRef} importData={importData} clearSubstitutions={() => setState((current) => ({ ...current, exerciseSubstitutions: {} }))} />
    </main>
  );
}
