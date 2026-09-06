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
import {
  loadState,
  parseImportedState,
  saveState,
  serializeState,
} from "./storage.js";
import {
  exerciseHistory,
  nextProgressionAdvice,
} from "./progression.js";
import { sessionProgress } from "./session.js";

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

function Metric({ label, value, unit, accent = false, subtle }) {
  return (
    <motion.div
      className={`metric ${accent ? "metric-accent" : ""}`}
      initial={{ opacity: 0, y: 10, scale: .97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: .35 }}
      transition={{ type: "spring", stiffness: 330, damping: 27 }}
    >
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-unit">{unit}</div>
      {subtle ? <div className="metric-subtle">{subtle}</div> : null}
    </motion.div>
  );
}

function RestTimer({ timer, onStart, onStop }) {
  const minutes = Math.floor(timer.remaining / 60);
  const seconds = timer.remaining % 60;
  const elapsed = timer.total ? Math.max(0, Math.min(1, 1 - timer.remaining / timer.total)) : 0;
  return (
    <div className={`rest-widget rest-widget-v4 ${timer.running ? "running" : ""}`} aria-live="polite">
      <div className="rest-v4-top">
        <div>
          <span className="rest-label">DESCANSO</span>
          <strong>{minutes}:{String(seconds).padStart(2, "0")}</strong>
        </div>
        <div className="rest-ring" style={{ "--rest-deg": `${Math.round(elapsed * 360)}deg` }} aria-hidden="true"><i /></div>
      </div>
      <div className="rest-actions rest-presets">
        {[60, 90, 120, 180, 240, 300].map((value) => (
          <button key={value} type="button" onClick={() => onStart(value)}>
            {value < 120 ? `${value}s` : `${value / 60}m`}
          </button>
        ))}
        {timer.running ? <button className="rest-stop" type="button" onClick={onStop}>×</button> : null}
      </div>
    </div>
  );
}

function ProfileSheet({ open, onClose, profile, updateProfile, exportData, importRef, importData }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="motor-settings-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
          <motion.section
            className="motor-settings-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="motor-settings-title"
            initial={{ y: 60, opacity: 0, scale: .97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 42, opacity: 0, scale: .98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="motor-sheet-handle" aria-hidden="true" />
            <div className="motor-settings-head">
              <div><span>MOTOR</span><h2 id="motor-settings-title">Configuración de entrenamiento</h2></div>
              <motion.button type="button" whileTap={{ scale: .9 }} onClick={onClose}>Listo</motion.button>
            </div>

            <div className="motor-settings-grid">
              <Field label="OBJETIVO" hint="Cambia reps, series, RIR, descansos y progresión.">
                <select className="control" value={profile.objetivo} onChange={updateProfile("objetivo")}>
                  {Object.entries(PROGRAM_GOAL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              {profile.objetivo === "pr" ? (
                <Field label="LEVANTAMIENTO PR">
                  <select className="control" value={profile.prLift} onChange={updateProfile("prLift")}>
                    {PR_LIFT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
              ) : null}
              <Field label="SPLIT / FRECUENCIA">
                <select className="control" value={profile.dias} onChange={updateProfile("dias")}>
                  {SPLIT_OPTIONS.map(([days, label]) => <option key={days} value={days}>{days} días · {label}</option>)}
                </select>
              </Field>
              <Field label="EXPERIENCIA">
                <select className="control" value={profile.experiencia} onChange={updateProfile("experiencia")}>
                  <option value="nunca">Principiante</option><option value="basico">Básico</option><option value="intermedio">Intermedio</option>
                </select>
              </Field>
              <Field label="EQUIPO">
                <select className="control" value={profile.equipo} onChange={updateProfile("equipo")}>
                  {Object.entries(EQUIPMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="DURACIÓN">
                <select className="control" value={profile.duracion} onChange={updateProfile("duracion")}>
                  {[45, 60, 75, 90].map((value) => <option key={value} value={value}>{value} min</option>)}
                </select>
              </Field>
              <Field label="ENFOQUE">
                <select className="control" value={profile.enfoque} onChange={updateProfile("enfoque")}>
                  {FOCUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="ACTIVIDAD FUERA DEL GYM">
                <select className="control" value={profile.actividad} onChange={updateProfile("actividad")}>
                  {Object.entries(ACTIVITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
            </div>

            <div className="motor-settings-separator"><span>Datos personales</span></div>
            <div className="motor-settings-grid compact">
              <Field label="PESO (KG)"><input className="control" type="number" min="35" max="250" step="0.1" value={profile.peso} onChange={updateProfile("peso")} /></Field>
              <Field label="ESTATURA (CM)"><input className="control" type="number" min="120" max="230" value={profile.estatura} onChange={updateProfile("estatura")} /></Field>
              <Field label="EDAD"><input className="control" type="number" min="18" max="90" value={profile.edad} onChange={updateProfile("edad")} /></Field>
              <Field label="SEXO"><select className="control" value={profile.sexo} onChange={updateProfile("sexo")}><option value="hombre">Hombre</option><option value="mujer">Mujer</option></select></Field>
            </div>

            <div className="motor-settings-separator"><span>Respaldo</span></div>
            <div className="data-actions motor-data-actions">
              <button className="primary-btn" type="button" onClick={exportData}>Exportar datos</button>
              <button className="secondary-btn" type="button" onClick={() => importRef.current?.click()}>Importar respaldo</button>
              <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importData} />
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function AppV4() {
  const [state, setState] = useState(() => loadState());
  const [activeDay, setActiveDay] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [bodyDraft, setBodyDraft] = useState({ date: localDate(), weight: state.profile.peso, calories: "" });
  const [notice, setNotice] = useState("");
  const [timer, setTimer] = useState({ remaining: 0, total: 0, running: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const importRef = useRef(null);

  const { profile, readiness, exerciseLogs, bodyLogs, sessionCompletions } = state;
  const nutrition = useMemo(() => calcNutrition(profile, bodyLogs), [profile, bodyLogs]);
  const plan = useMemo(() => adaptTrainingPlan(buildPlan(profile, readiness, sessionCompletions), profile), [profile, readiness, sessionCompletions]);
  const session = plan.sessions[activeDay] ?? plan.sessions[0];
  const progress = useMemo(() => sessionProgress(session, exerciseLogs, sessionCompletions), [session, exerciseLogs, sessionCompletions]);

  useEffect(() => saveState(state), [state]);
  useEffect(() => { if (activeDay >= plan.sessions.length) setActiveDay(0); }, [activeDay, plan.sessions.length]);
  useEffect(() => {
    const open = () => setSettingsOpen(true);
    window.addEventListener("fitness:open-motor-settings", open);
    return () => window.removeEventListener("fitness:open-motor-settings", open);
  }, []);

  useEffect(() => {
    if (!timer.running) return undefined;
    const id = window.setInterval(() => {
      setTimer((current) => {
        if (current.remaining <= 1) {
          setNotice("Descanso terminado.");
          return { remaining: 0, total: 0, running: false };
        }
        return { ...current, remaining: current.remaining - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer.running]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(id);
  }, [notice]);

  const updateProfile = (key) => (event) => {
    const numeric = ["peso", "estatura", "edad", "dias", "duracion"].includes(key);
    const value = numeric ? Number(event.target.value) : event.target.value;
    setState((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
  };

  const updateReadiness = (key) => (event) => {
    setState((current) => ({ ...current, readiness: { ...current.readiness, [key]: Number(event.target.value) } }));
  };

  const updateSetDraft = (draftKey, setIndex, field, value) => {
    setDrafts((current) => {
      const nextSets = [...(current[draftKey] ?? [])];
      nextSets[setIndex] = { ...(nextSets[setIndex] ?? {}), [field]: value };
      return { ...current, [draftKey]: nextSets };
    });
  };

  const startRest = (seconds) => setTimer({ remaining: seconds, total: seconds, running: true });
  const stopRest = () => setTimer({ remaining: 0, total: 0, running: false });

  const saveExercise = (exerciseItem) => {
    const draftKey = `${session.label}|${exerciseItem.id}`;
    const advice = nextProgressionAdvice(exerciseItem, exerciseLogs, profile);
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

    const newLog = {
      id: uid(),
      createdAt: new Date().toISOString(),
      sessionLabel: session.label,
      exerciseId: exerciseItem.id,
      exerciseName: exerciseItem.name,
      sets,
    };
    const pr = detectPR(exerciseLogs, newLog);
    setState((current) => ({ ...current, exerciseLogs: [...current.exerciseLogs, newLog].slice(-1000) }));
    setDrafts((current) => ({ ...current, [draftKey]: [] }));

    if (pr.e1rmPR) setNotice(`Nuevo PR estimado en ${exerciseItem.name}.`);
    else if (pr.volumePR) setNotice(`Nuevo récord de volumen en ${exerciseItem.name}.`);
    else setNotice(`${exerciseItem.name} guardado.`);
  };

  const finishSession = () => {
    const current = sessionProgress(session, exerciseLogs, sessionCompletions);
    if (!current.canFinish) {
      setNotice("Guarda al menos un ejercicio antes de finalizar la sesión.");
      return;
    }
    const duplicate = sessionCompletions.some((item) => item.sessionLabel === session.label && Date.now() - new Date(item.createdAt).getTime() < 120000);
    if (duplicate) {
      setNotice("Esta sesión ya se finalizó hace un momento.");
      return;
    }
    const completion = { id: uid(), createdAt: new Date().toISOString(), sessionLabel: session.label };
    setState((currentState) => ({ ...currentState, sessionCompletions: [...currentState.sessionCompletions, completion].slice(-500) }));
    setActiveDay((value) => (value + 1) % plan.sessions.length);
    setNotice(`Sesión terminada · ${current.completed}/${current.planned} ejercicios registrados.`);
  };

  const saveBodyCheckin = () => {
    const weight = Number(bodyDraft.weight);
    const calories = Number(bodyDraft.calories);
    if (!bodyDraft.date || !Number.isFinite(weight) || weight <= 0) {
      setNotice("Revisa la fecha y el peso del check-in.");
      return;
    }
    const entry = { id: uid(), date: bodyDraft.date, weight, calories: Number.isFinite(calories) && calories > 0 ? Math.round(calories) : null };
    setState((current) => ({
      ...current,
      profile: { ...current.profile, peso: weight },
      bodyLogs: [...current.bodyLogs.filter((item) => item.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-365),
    }));
    setNotice("Check-in corporal guardado.");
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
    try {
      const imported = parseImportedState(await file.text());
      setState(imported);
      setBodyDraft({ date: localDate(), weight: imported.profile.peso, calories: "" });
      setNotice("Respaldo importado correctamente.");
    } catch (error) {
      setNotice(error.message || "No se pudo importar el respaldo.");
    }
  };

  const expenditureLabel = nutrition.expenditure.source === "adaptive"
    ? `Adaptativo · ${Math.round(nutrition.expenditure.confidence * 100)}% confianza`
    : nutrition.expenditure.source === "blended"
      ? `Mixto · ${Math.round(nutrition.expenditure.confidence * 100)}% datos`
      : "Fórmula inicial";

  const trendText = nutrition.trend.weeklyChangePct == null
    ? "Sin tendencia suficiente"
    : `${nutrition.trend.weeklyChangeKg > 0 ? "+" : ""}${nutrition.trend.weeklyChangeKg} kg/sem`;

  return (
    <main className={`app-shell app-v4 goal-${profile.objetivo}`}>
      <div className="container">
        <header className="header v4-hero">
          <div className="v4-hero-copy">
            <p className="eyebrow">MOTOR FITNESS 4.1</p>
            <div className="v4-status-row">
              <span>{PROGRAM_GOAL_LABELS[profile.objetivo]}</span>
              <span>{EXPERIENCE_LABELS[profile.experiencia]}</span>
              <span>Semana {plan.mesocycle.week}/6</span>
            </div>
            <h1>{session.label}</h1>
            <p className="subtitle">El motor ajusta programación, progresión y recuperación con tus registros reales.</p>
            <div className="v4-hero-actions">
              <motion.button className="primary-btn" type="button" whileTap={{ scale: .96 }} onClick={() => document.querySelector(".routine-card")?.scrollIntoView({ behavior: "smooth" })}>Entrenar ahora</motion.button>
              <motion.button className="secondary-btn settings-launch" type="button" whileTap={{ scale: .96 }} onClick={() => setSettingsOpen(true)}>Configurar motor</motion.button>
            </div>
          </div>
          <RestTimer timer={timer} onStart={startRest} onStop={stopRest} />
        </header>

        {notice ? <div className="toast" role="status">{notice}</div> : null}

        <section className="card session-overview">
          <div className="section-heading"><h2 className="section-title">SESIÓN ACTUAL</h2><span>{progress.completed}/{progress.planned} ejercicios</span></div>
          <div className="session-progress-track"><motion.i animate={{ width: `${progress.percent}%` }} transition={{ type: "spring", stiffness: 260, damping: 30 }} /></div>
          <div className="session-overview-row">
            <div><span>Recuperación</span><strong>{plan.readiness.label}</strong></div>
            <div><span>RIR de semana</span><strong>{plan.programming?.targetRir ?? plan.mesocycle.targetRir}</strong></div>
            <div><span>Split</span><strong>{plan.name}</strong></div>
          </div>
        </section>

        <div className="v4-main-grid">
          <section className="stack">
            <section className="card routine-card">
              <div className="section-heading"><h2 className="section-title">ENTRENAMIENTO</h2><span>{profile.duracion} min · {EQUIPMENT_LABELS[profile.equipo]}</span></div>
              <div className="session-tabs" role="tablist" aria-label="Días de entrenamiento">
                {plan.sessions.map((item, index) => (
                  <motion.button key={item.label} type="button" role="tab" aria-selected={index === activeDay} className={`tab ${index === activeDay ? "active" : ""}`} whileTap={{ scale: .94 }} onClick={() => setActiveDay(index)}>Día {index + 1}</motion.button>
                ))}
              </div>
              <div className="session-head">
                <div><h2>{session.label}</h2><span>{PROGRAM_GOAL_LABELS[profile.objetivo]} · progresión específica por objetivo</span></div>
                <button className="secondary-btn" type="button" onClick={finishSession}>Finalizar</button>
              </div>

              <div className="exercise-list">
                {session.exercises.map((exerciseItem, exerciseIndex) => {
                  const history = exerciseHistory(exerciseLogs, exerciseItem.id, 4);
                  const previous = history.at(-1);
                  const previousSummary = previous ? summarizeExerciseLog(previous) : null;
                  const advice = nextProgressionAdvice(exerciseItem, exerciseLogs, profile);
                  const p = exerciseItem.prescription;
                  const draftKey = `${session.label}|${exerciseItem.id}`;
                  const exerciseDraft = drafts[draftKey] ?? [];
                  const warmups = exerciseItem.type === "compound" && advice.nextWeight ? warmupPlan(advice.nextWeight, exerciseItem.increment) : [];

                  return (
                    <motion.article
                      className="exercise"
                      key={exerciseItem.id}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: .32, delay: Math.min(exerciseIndex * .035, .18) }}
                    >
                      <div className="exercise-top">
                        <div>
                          <div className="exercise-name">{exerciseItem.name}</div>
                          <div className="exercise-group">{exerciseItem.group} · {exerciseItem.type === "compound" ? "Compuesto" : "Aislamiento"}{exerciseItem.prRole ? ` · PR ${exerciseItem.prRole === "primary" ? "principal" : "técnico"}` : ""}</div>
                          <div className={`progression-badge progression-${advice.status}`}>{advice.badge}{advice.trend?.label && advice.trend.status !== "new" ? ` · ${advice.trend.label}` : ""}</div>
                        </div>
                        <div className="prescription-block">
                          <div className="prescription">{p.sets} × {p.min}-{p.max} · RIR {p.rir}</div>
                          <div className="exercise-meta">{p.intent}</div>
                          <button className="timer-btn" type="button" onClick={() => startRest(p.rest)}>Descanso {formatRest(p.rest)}</button>
                        </div>
                      </div>

                      {warmups.length ? <div className="warmup"><span>Calentamiento</span>{warmups.map((item, index) => <b key={`${item.weight}-${index}`}>{item.weight}kg × {item.reps}</b>)}</div> : null}

                      <div className="sets-table">
                        <div className="set-row set-head"><span>Serie</span><span>{exerciseItem.loadType === "bodyweight" ? "Lastre" : "Kg"}</span><span>Reps</span><span>RIR</span></div>
                        {Array.from({ length: p.sets }, (_, setIndex) => {
                          const raw = exerciseDraft[setIndex] ?? {};
                          return (
                            <div className="set-row" key={setIndex}>
                              <strong>{setIndex + 1}</strong>
                              <input aria-label={`${exerciseItem.name} serie ${setIndex + 1} carga`} className="log-input" type="number" min="0" step="0.5" placeholder={advice.nextWeight ?? "0"} value={raw.weight ?? ""} onChange={(event) => updateSetDraft(draftKey, setIndex, "weight", event.target.value)} />
                              <input aria-label={`${exerciseItem.name} serie ${setIndex + 1} repeticiones`} className="log-input" type="number" min="1" max="50" placeholder={`${p.min}-${p.max}`} value={raw.reps ?? ""} onChange={(event) => updateSetDraft(draftKey, setIndex, "reps", event.target.value)} />
                              <input aria-label={`${exerciseItem.name} serie ${setIndex + 1} RIR`} className="log-input" type="number" min="0" max="8" placeholder={p.rir} value={raw.rir ?? ""} onChange={(event) => updateSetDraft(draftKey, setIndex, "rir", event.target.value)} />
                            </div>
                          );
                        })}
                      </div>

                      <div className="exercise-footer">
                        <div className="advice"><span>{previous ? `Último · ${previous.sets.length} series${previousSummary?.bestE1RM ? ` · e1RM ${previousSummary.bestE1RM} kg` : ""}` : "Primera exposición"}</span><strong>{advice.action}</strong></div>
                        <motion.button className="save-btn" type="button" whileTap={{ scale: .96 }} onClick={() => saveExercise(exerciseItem)}>Guardar ejercicio</motion.button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </section>

            <section className="card recovery-card">
              <div className="section-heading"><h2 className="section-title">RECUPERACIÓN</h2><span>{plan.readiness.score}/15</span></div>
              <div className="readiness-grid">
                {[["energia", "ENERGÍA", "1 baja · 5 alta"], ["sueno", "SUEÑO", "1 malo · 5 bueno"], ["dolor", "AGUJETAS", "1 bajas · 5 altas"]].map(([key, label, hint]) => (
                  <Field key={key} label={label} hint={hint}><div className="range-line"><input aria-label={label} type="range" min="1" max="5" value={readiness[key]} onChange={updateReadiness(key)} /><span>{readiness[key]}</span></div></Field>
                ))}
              </div>
              <div className={`readiness-status status-${plan.readiness.status}`}>
                <div><span>Estado</span><strong>{plan.readiness.label}</strong></div>
                <div><span>Semana</span><strong>{plan.mesocycle.week}/6</strong></div>
                <div><span>Objetivo</span><strong>{PROGRAM_GOAL_LABELS[profile.objetivo]}</strong></div>
              </div>
            </section>
          </section>

          <aside className="v4-side-stack">
            <section className="card nutrition-card">
              <div className="section-heading"><h2 className="section-title">COMBUSTIBLE</h2><span>{expenditureLabel}</span></div>
              <div className="metrics compact-metrics">
                <Metric label="GASTO" value={nutrition.expenditure.expenditure} unit="kcal/día" />
                <Metric label="META" value={nutrition.target} unit="kcal/día" accent />
              </div>
              <div className="macro-row compact-macros">
                <div className="macro"><span>PROTEÍNA</span><strong>{nutrition.macros.protein} g</strong></div>
                <div className="macro"><span>CARBOS</span><strong>{nutrition.macros.carbs} g</strong></div>
                <div className="macro"><span>GRASAS</span><strong>{nutrition.macros.fat} g</strong></div>
              </div>
            </section>

            <section className="card body-card">
              <div className="section-heading"><h2 className="section-title">CHECK-IN</h2><span>{trendText}</span></div>
              <div className="body-checkin compact-checkin">
                <Field label="FECHA"><input className="control" type="date" value={bodyDraft.date} onChange={(event) => setBodyDraft((current) => ({ ...current, date: event.target.value }))} /></Field>
                <Field label="PESO"><input className="control" type="number" step="0.1" value={bodyDraft.weight} onChange={(event) => setBodyDraft((current) => ({ ...current, weight: event.target.value }))} /></Field>
                <Field label="CALORÍAS REALES" hint="Opcional; mejora la estimación adaptativa."><input className="control" type="number" min="0" placeholder="Ej. 2400" value={bodyDraft.calories} onChange={(event) => setBodyDraft((current) => ({ ...current, calories: event.target.value }))} /></Field>
              </div>
              <button className="primary-btn full-btn" type="button" onClick={saveBodyCheckin}>Guardar check-in</button>
            </section>

            <details className="card program-details">
              <summary><span>PROGRAMACIÓN</span><strong>{plan.programming.title}</strong></summary>
              <p className="body-copy">{plan.programming.summary}</p>
              <div className="program-mini-grid">
                <div><span>Principales</span><strong>{plan.programming.primaryRange}</strong></div>
                <div><span>Accesorios</span><strong>{plan.programming.accessoryRange}</strong></div>
                <div><span>Descanso</span><strong>{plan.programming.rest}</strong></div>
              </div>
              <p className="body-copy"><strong>Split:</strong> {plan.programming.splitNote}</p>
              {plan.programming.warning ? <div className="empty compact">{plan.programming.warning}</div> : null}
            </details>

            <section className="card volume-card">
              <div className="section-heading"><h2 className="section-title">VOLUMEN SEMANAL</h2><span>series eq.</span></div>
              <div className="volume-grid">
                {Object.entries(plan.weeklyVolume).filter(([, value]) => value > 0).map(([muscle, value]) => <div className="volume-chip" key={muscle}><span>{muscle}</span><strong>{value}</strong></div>)}
              </div>
            </section>
          </aside>
        </div>

        <section className="card history history-card">
          <div className="section-heading"><h2 className="section-title">PROGRESO RECIENTE</h2><span>{exerciseLogs.length} registros</span></div>
          {exerciseLogs.length ? (
            <div className="history-v4-list">
              {[...exerciseLogs].reverse().slice(0, 10).map((log) => {
                const summary = summarizeExerciseLog(log);
                return <div className="history-row" key={log.id}><div><strong>{log.exerciseName}</strong><span>{log.sessionLabel}</span></div><div className="history-stats"><b>{log.sets.length} series</b><span>{summary.bestE1RM ? `e1RM ${summary.bestE1RM} kg` : `${summary.avgReps} reps prom.`}</span></div></div>;
              })}
            </div>
          ) : <div className="empty">Guarda tus primeras series para activar PRs y progresión automática.</div>}
        </section>

        <footer className="card footer-note v4-footer">
          <strong>Motor Fitness 4.1.</strong> La progresión usa tus exposiciones recientes y evita descargar por una sola sesión mala. Las estimaciones de calorías y e1RM son aproximaciones; dolor agudo, lesión, mareo, dolor torácico o síntomas inusuales prevalecen sobre cualquier recomendación del motor.
        </footer>
      </div>

      <ProfileSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} profile={profile} updateProfile={updateProfile} exportData={exportData} importRef={importRef} importData={importData} />
    </main>
  );
}
