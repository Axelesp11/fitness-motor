import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  ACTIVITY_LABELS,
  EQUIPMENT_LABELS,
  EXPERIENCE_LABELS,
  FOCUS_OPTIONS,
  GOAL_LABELS,
  buildPlan,
  calcNutrition,
  detectPR,
  formatRest,
  nextLoadAdvice,
  summarizeExerciseLog,
  warmupPlan,
} from "./engine";
import {
  loadState,
  parseImportedState,
  saveState,
  serializeState,
} from "./storage";

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
    <div className={`metric ${accent ? "metric-accent" : ""}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-unit">{unit}</div>
      {subtle ? <div className="metric-subtle">{subtle}</div> : null}
    </div>
  );
}

function Sparkline({ points }) {
  if (!points || points.length < 2) return <div className="empty compact">Registra al menos 2 pesos para ver tendencia.</div>;
  const values = points.slice(-20).map((p) => p.trend ?? p.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.1, max - min);
  const coords = values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
    const y = 34 - ((value - min) / span) * 28;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 100 40" role="img" aria-label="Tendencia reciente de peso">
      <polyline points={coords} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function RestTimer({ timer, onStart, onStop }) {
  const minutes = Math.floor(timer.remaining / 60);
  const seconds = timer.remaining % 60;
  return (
    <div className={`rest-widget ${timer.running ? "running" : ""}`} aria-live="polite">
      <div>
        <span className="rest-label">DESCANSO</span>
        <strong>{minutes}:{String(seconds).padStart(2, "0")}</strong>
      </div>
      <div className="rest-actions">
        {[60, 90, 120, 180].map((value) => (
          <button key={value} type="button" onClick={() => onStart(value)}>{value < 120 ? `${value}s` : `${value / 60}m`}</button>
        ))}
        {timer.running ? <button type="button" onClick={onStop}>×</button> : null}
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [activeDay, setActiveDay] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [bodyDraft, setBodyDraft] = useState({ date: localDate(), weight: state.profile.peso, calories: "" });
  const [notice, setNotice] = useState("");
  const [timer, setTimer] = useState({ remaining: 0, running: false });
  const importRef = useRef(null);

  const { profile, readiness, exerciseLogs, bodyLogs, sessionCompletions } = state;
  const nutrition = useMemo(() => calcNutrition(profile, bodyLogs), [profile, bodyLogs]);
  const plan = useMemo(() => buildPlan(profile, readiness, sessionCompletions), [profile, readiness, sessionCompletions]);
  const session = plan.sessions[activeDay] ?? plan.sessions[0];

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (activeDay >= plan.sessions.length) setActiveDay(0);
  }, [activeDay, plan.sessions.length]);

  useEffect(() => {
    if (!timer.running) return undefined;
    const id = window.setInterval(() => {
      setTimer((current) => {
        if (current.remaining <= 1) {
          setNotice("Descanso terminado.");
          return { remaining: 0, running: false };
        }
        return { ...current, remaining: current.remaining - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer.running]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const lastLogByExercise = useMemo(() => {
    const map = {};
    exerciseLogs.forEach((log) => { map[log.exerciseId] = log; });
    return map;
  }, [exerciseLogs]);

  const updateProfile = (key) => (event) => {
    const numeric = ["peso", "estatura", "edad", "dias", "duracion"].includes(key);
    const value = numeric ? Number(event.target.value) : event.target.value;
    setState((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
  };

  const updateReadiness = (key) => (event) => {
    setState((current) => ({
      ...current,
      readiness: { ...current.readiness, [key]: Number(event.target.value) },
    }));
  };

  const updateSetDraft = (draftKey, setIndex, field, value) => {
    setDrafts((current) => {
      const currentSets = current[draftKey] ?? [];
      const nextSets = [...currentSets];
      nextSets[setIndex] = { ...(nextSets[setIndex] ?? {}), [field]: value };
      return { ...current, [draftKey]: nextSets };
    });
  };

  const saveExercise = (exerciseItem) => {
    const draftKey = `${session.label}|${exerciseItem.id}`;
    const advice = nextLoadAdvice(exerciseItem, lastLogByExercise[exerciseItem.id]);
    const rawSets = drafts[draftKey] ?? [];
    const sets = Array.from({ length: exerciseItem.prescription.sets }, (_, index) => {
      const raw = rawSets[index] ?? {};
      const weight = raw.weight === "" || raw.weight == null ? (advice.nextWeight ?? 0) : Number(raw.weight);
      const reps = Number(raw.reps);
      const rir = raw.rir === "" || raw.rir == null ? exerciseItem.prescription.rir : Number(raw.rir);
      return { weight: Number.isFinite(weight) ? Math.max(0, weight) : 0, reps, rir };
    }).filter((set) => Number.isFinite(set.reps) && set.reps > 0 && Number.isFinite(set.rir));

    if (!sets.length) {
      setNotice("Registra por lo menos una serie con repeticiones.");
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

  const saveBodyCheckin = () => {
    const weight = Number(bodyDraft.weight);
    const calories = Number(bodyDraft.calories);
    if (!bodyDraft.date || !Number.isFinite(weight) || weight <= 0) {
      setNotice("Revisa la fecha y el peso del check-in.");
      return;
    }
    const entry = {
      id: uid(),
      date: bodyDraft.date,
      weight,
      calories: Number.isFinite(calories) && calories > 0 ? Math.round(calories) : null,
    };
    setState((current) => ({
      ...current,
      profile: { ...current.profile, peso: weight },
      bodyLogs: [...current.bodyLogs.filter((x) => x.date !== entry.date), entry]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-365),
    }));
    setNotice("Check-in corporal guardado.");
  };

  const finishSession = () => {
    const recentDuplicate = sessionCompletions.some((item) => (
      item.sessionLabel === session.label && Date.now() - new Date(item.createdAt).getTime() < 120000
    ));
    if (recentDuplicate) {
      setNotice("Esta sesión ya se marcó como terminada hace un momento.");
      return;
    }
    const completion = { id: uid(), createdAt: new Date().toISOString(), sessionLabel: session.label };
    setState((current) => ({ ...current, sessionCompletions: [...current.sessionCompletions, completion].slice(-500) }));
    setActiveDay((current) => (current + 1) % plan.sessions.length);
    setNotice("Sesión terminada. El mesociclo avanzará automáticamente.");
  };

  const startRest = (seconds) => setTimer({ remaining: seconds, running: true });
  const stopRest = () => setTimer({ remaining: 0, running: false });

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
    : `${nutrition.trend.weeklyChangeKg > 0 ? "+" : ""}${nutrition.trend.weeklyChangeKg} kg/sem · ${(nutrition.trend.weeklyChangePct * 100).toFixed(2)}%`;

  return (
    <main className="app-shell">
      <div className="container">
        <header className="header">
          <div>
            <p className="eyebrow">MOTOR FITNESS 3.0</p>
            <h1>Entrena, registra y deja que el plan se recalibre.</h1>
            <p className="subtitle">Motor local-first para adultos sanos: programación, series reales, recuperación, progresión y nutrición adaptativa.</p>
          </div>
          <RestTimer timer={timer} onStart={startRest} onStop={stopRest} />
        </header>

        {notice ? <div className="toast" role="status">{notice}</div> : null}

        <div className="layout">
          <aside className="card sidebar">
            <div className="section-heading">
              <h2 className="section-title">PERFIL</h2>
              <span>auto</span>
            </div>
            <Field label="PESO (KG)"><input className="control" type="number" min="35" max="250" step="0.1" value={profile.peso} onChange={updateProfile("peso")} /></Field>
            <Field label="ESTATURA (CM)"><input className="control" type="number" min="120" max="230" value={profile.estatura} onChange={updateProfile("estatura")} /></Field>
            <Field label="EDAD"><input className="control" type="number" min="18" max="90" value={profile.edad} onChange={updateProfile("edad")} /></Field>
            <Field label="SEXO"><select className="control" value={profile.sexo} onChange={updateProfile("sexo")}><option value="hombre">Hombre</option><option value="mujer">Mujer</option></select></Field>
            <Field label="EXPERIENCIA"><select className="control" value={profile.experiencia} onChange={updateProfile("experiencia")}><option value="nunca">Principiante</option><option value="basico">Básico</option><option value="intermedio">Intermedio</option></select></Field>
            <Field label="OBJETIVO"><select className="control" value={profile.objetivo} onChange={updateProfile("objetivo")}><option value="hipertrofia">Hipertrofia</option><option value="fuerza">Fuerza</option><option value="perdida">Pérdida de grasa</option></select></Field>
            <Field label="DÍAS / SEMANA"><select className="control" value={profile.dias} onChange={updateProfile("dias")}>{[2,3,4,5,6].map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
            <Field label="ACTIVIDAD FUERA DEL ENTRENAMIENTO" hint="Trabajo, pasos y movimiento habitual; el gym se estima aparte."><select className="control" value={profile.actividad} onChange={updateProfile("actividad")}>{Object.entries(ACTIVITY_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="EQUIPO"><select className="control" value={profile.equipo} onChange={updateProfile("equipo")}>{Object.entries(EQUIPMENT_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="DURACIÓN"><select className="control" value={profile.duracion} onChange={updateProfile("duracion")}>{[45,60,75,90].map((m) => <option key={m} value={m}>{m} min</option>)}</select></Field>
            <Field label="ENFOQUE"><select className="control" value={profile.enfoque} onChange={updateProfile("enfoque")}>{FOCUS_OPTIONS.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          </aside>

          <section className="stack">
            <section className="card">
              <div className="section-heading">
                <h2 className="section-title">RESUMEN</h2>
                <span>{GOAL_LABELS[profile.objetivo]} · {EXPERIENCE_LABELS[profile.experiencia]}</span>
              </div>
              <div className="metrics">
                <Metric label="BMR" value={nutrition.bmr} unit="kcal/día" />
                <Metric label="GASTO" value={nutrition.expenditure.expenditure} unit="kcal/día" subtle={expenditureLabel} />
                <Metric label="OBJETIVO" value={nutrition.target} unit="kcal/día" accent />
                <Metric label="SPLIT" value={plan.name} unit={`${plan.sessions.length} sesiones`} subtle={`Semana ${plan.mesocycle.week}/6`} />
              </div>
              <div className="macro-row">
                <div className="macro"><span>PROTEÍNA</span><strong>{nutrition.macros.protein} g</strong></div>
                <div className="macro"><span>GRASAS</span><strong>{nutrition.macros.fat} g</strong></div>
                <div className="macro"><span>CARBOS</span><strong>{nutrition.macros.carbs} g</strong></div>
                <div className="macro"><span>RITMO META</span><strong>{nutrition.goalRate === 0 ? "Mantener" : `${nutrition.goalRate > 0 ? "+" : ""}${(nutrition.goalRate * 100).toFixed(2)}%/sem`}</strong></div>
              </div>
            </section>

            <section className="grid-two">
              <div className="card">
                <div className="section-heading"><h2 className="section-title">CHECK-IN CORPORAL</h2><span>{trendText}</span></div>
                <div className="body-checkin">
                  <Field label="FECHA"><input className="control" type="date" value={bodyDraft.date} onChange={(e) => setBodyDraft((x) => ({ ...x, date: e.target.value }))} /></Field>
                  <Field label="PESO (KG)"><input className="control" type="number" step="0.1" value={bodyDraft.weight} onChange={(e) => setBodyDraft((x) => ({ ...x, weight: e.target.value }))} /></Field>
                  <Field label="CALORÍAS REALES" hint="Opcional; con 7+ días el gasto empieza a adaptarse."><input className="control" type="number" min="0" placeholder="Ej. 2400" value={bodyDraft.calories} onChange={(e) => setBodyDraft((x) => ({ ...x, calories: e.target.value }))} /></Field>
                </div>
                <button className="primary-btn" type="button" onClick={saveBodyCheckin}>Guardar check-in</button>
                <Sparkline points={nutrition.trend.points} />
              </div>

              <div className="card">
                <div className="section-heading"><h2 className="section-title">RECUPERACIÓN</h2><span>RIR meta {plan.mesocycle.targetRir}</span></div>
                <div className="readiness-grid">
                  {[ ["energia","ENERGÍA","1 baja · 5 alta"], ["sueno","SUEÑO","1 malo · 5 bueno"], ["dolor","DOLOR / AGUJETAS","1 bajo · 5 alto"] ].map(([key,label,hint]) => (
                    <Field key={key} label={label} hint={hint}>
                      <div className="range-line"><input aria-label={label} type="range" min="1" max="5" value={readiness[key]} onChange={updateReadiness(key)} /><span>{readiness[key]}</span></div>
                    </Field>
                  ))}
                </div>
                <div className={`readiness-status status-${plan.readiness.status}`}>
                  <div><span>Estado</span><strong>{plan.readiness.label}</strong></div>
                  <div><span>Puntuación</span><strong>{plan.readiness.score}/15</strong></div>
                  <div><span>Mesociclo</span><strong>Semana {plan.mesocycle.week}/6</strong></div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="section-heading"><h2 className="section-title">VOLUMEN SEMANAL ESTIMADO</h2><span>series directas + contribución secundaria</span></div>
              <div className="volume-grid">
                {Object.entries(plan.weeklyVolume).filter(([,value]) => value > 0).map(([muscle,value]) => (
                  <div className="volume-chip" key={muscle}><span>{muscle}</span><strong>{value}</strong><small>series eq.</small></div>
                ))}
              </div>
            </section>

            <section className="card routine-card">
              <div className="section-heading"><h2 className="section-title">RUTINA ADAPTATIVA</h2><span>{profile.duracion} min · {EQUIPMENT_LABELS[profile.equipo]}</span></div>
              <div className="session-tabs" role="tablist" aria-label="Días de entrenamiento">
                {plan.sessions.map((item,index) => <button type="button" role="tab" aria-selected={index===activeDay} key={item.label} className={`tab ${index===activeDay ? "active" : ""}`} onClick={() => setActiveDay(index)}>Día {index+1}</button>)}
              </div>
              <div className="session-head"><div><h2>{session.label}</h2><span>RIR objetivo ajustado por semana y recuperación</span></div><button className="secondary-btn" type="button" onClick={finishSession}>Finalizar sesión</button></div>

              <div className="exercise-list">
                {session.exercises.map((exerciseItem) => {
                  const previous = lastLogByExercise[exerciseItem.id];
                  const advice = nextLoadAdvice(exerciseItem, previous);
                  const p = exerciseItem.prescription;
                  const draftKey = `${session.label}|${exerciseItem.id}`;
                  const exerciseDraft = drafts[draftKey] ?? [];
                  const warmups = exerciseItem.type === "compound" && advice.nextWeight ? warmupPlan(advice.nextWeight, exerciseItem.increment) : [];
                  const previousSummary = previous ? summarizeExerciseLog(previous) : null;

                  return (
                    <article className="exercise" key={exerciseItem.id}>
                      <div className="exercise-top">
                        <div><div className="exercise-name">{exerciseItem.name}</div><div className="exercise-group">{exerciseItem.group} · {exerciseItem.type === "compound" ? "Compuesto" : "Aislamiento"}</div></div>
                        <div className="prescription-block"><div className="prescription">{p.sets} × {p.min}-{p.max} · RIR {p.rir}</div><button className="timer-btn" type="button" onClick={() => startRest(p.rest)}>Descanso {formatRest(p.rest)}</button></div>
                      </div>

                      {warmups.length ? <div className="warmup"><span>Calentamiento sugerido</span>{warmups.map((x,i) => <b key={`${x.weight}-${i}`}>{x.weight}kg × {x.reps}</b>)}</div> : null}

                      <div className="sets-table">
                        <div className="set-row set-head"><span>Serie</span><span>{exerciseItem.loadType === "bodyweight" ? "Lastre kg" : "Carga kg"}</span><span>Reps</span><span>RIR</span></div>
                        {Array.from({ length: p.sets }, (_, setIndex) => {
                          const raw = exerciseDraft[setIndex] ?? {};
                          return (
                            <div className="set-row" key={setIndex}>
                              <strong>{setIndex + 1}</strong>
                              <input aria-label={`${exerciseItem.name} serie ${setIndex+1} carga`} className="log-input" type="number" min="0" step="0.5" placeholder={advice.nextWeight ?? "0"} value={raw.weight ?? ""} onChange={(e) => updateSetDraft(draftKey,setIndex,"weight",e.target.value)} />
                              <input aria-label={`${exerciseItem.name} serie ${setIndex+1} repeticiones`} className="log-input" type="number" min="1" max="50" placeholder={`${p.min}-${p.max}`} value={raw.reps ?? ""} onChange={(e) => updateSetDraft(draftKey,setIndex,"reps",e.target.value)} />
                              <input aria-label={`${exerciseItem.name} serie ${setIndex+1} RIR`} className="log-input" type="number" min="0" max="8" placeholder={p.rir} value={raw.rir ?? ""} onChange={(e) => updateSetDraft(draftKey,setIndex,"rir",e.target.value)} />
                            </div>
                          );
                        })}
                      </div>

                      <div className="exercise-footer">
                        <div className="advice"><span>{previous ? `Último: ${previous.sets.length} series · e1RM ${previousSummary.bestE1RM ?? "—"} kg` : "Sin historial"}</span><strong>{advice.action}</strong></div>
                        <button className="save-btn" type="button" onClick={() => saveExercise(exerciseItem)}>Guardar ejercicio</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="grid-two">
              <div className="card">
                <div className="section-heading"><h2 className="section-title">HISTORIAL RECIENTE</h2><span>{exerciseLogs.length} registros</span></div>
                {exerciseLogs.length ? <div className="history">{[...exerciseLogs].reverse().slice(0,8).map((log) => { const summary=summarizeExerciseLog(log); return <div className="history-row" key={log.id}><div><strong>{log.exerciseName}</strong><span>{log.sessionLabel}</span></div><div className="history-stats"><b>{log.sets.length} series</b><span>{summary.bestE1RM ? `e1RM ${summary.bestE1RM} kg` : `${summary.avgReps} reps prom.`}</span></div></div>; })}</div> : <div className="empty">Guarda tus primeras series para activar PRs y progresión.</div>}
              </div>

              <div className="card">
                <div className="section-heading"><h2 className="section-title">DATOS</h2><span>local-first</span></div>
                <p className="body-copy">Tus registros viven en este navegador. Exporta un respaldo si cambias de dispositivo o limpias los datos del navegador.</p>
                <div className="data-actions">
                  <button className="primary-btn" type="button" onClick={exportData}>Exportar respaldo</button>
                  <button className="secondary-btn" type="button" onClick={() => importRef.current?.click()}>Importar respaldo</button>
                  <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importData} />
                </div>
              </div>
            </section>

            <footer className="card footer-note">
              <strong>Alcance.</strong> Diseñado para adultos sanos. Las calorías, el gasto y el e1RM son estimaciones; dolor agudo, lesión, mareo, dolor torácico o síntomas inusuales prevalecen sobre cualquier recomendación del motor. No sustituye valoración médica, nutricional ni de rehabilitación.
            </footer>
          </section>
        </div>
      </div>
    </main>
  );
}
