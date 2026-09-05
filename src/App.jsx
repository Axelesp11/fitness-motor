import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  EXPERIENCE_LABELS,
  GOAL_LABELS,
  buildPlan,
  calcNutrition,
  formatRest,
  nextLoadAdvice,
} from "./engine";

const DEFAULT_PROFILE = {
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
};

const DEFAULT_READINESS = { energia: 4, sueno: 4, dolor: 2 };

function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Metric({ label, value, unit, accent = false }) {
  return (
    <div className={`metric ${accent ? "metric-accent" : ""}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-unit">{unit}</div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(() => loadJSON("fitness-motor-profile", DEFAULT_PROFILE));
  const [readiness, setReadiness] = useState(() => loadJSON("fitness-motor-readiness", DEFAULT_READINESS));
  const [logs, setLogs] = useState(() => loadJSON("fitness-motor-logs", []));
  const [activeDay, setActiveDay] = useState(0);
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    window.localStorage.setItem("fitness-motor-profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    window.localStorage.setItem("fitness-motor-readiness", JSON.stringify(readiness));
  }, [readiness]);

  useEffect(() => {
    window.localStorage.setItem("fitness-motor-logs", JSON.stringify(logs));
  }, [logs]);

  const nutrition = useMemo(() => calcNutrition(profile), [profile]);
  const plan = useMemo(() => buildPlan(profile, readiness), [profile, readiness]);

  useEffect(() => {
    if (activeDay >= plan.sessions.length) setActiveDay(0);
  }, [activeDay, plan.sessions.length]);

  const session = plan.sessions[activeDay] || plan.sessions[0];

  const lastByExercise = useMemo(() => {
    const map = {};
    logs.forEach((log) => {
      map[log.exerciseId] = log;
    });
    return map;
  }, [logs]);

  const updateProfile = (key) => (event) => {
    const numeric = ["peso", "estatura", "edad", "dias", "duracion"].includes(key);
    setProfile((prev) => ({
      ...prev,
      [key]: numeric ? Number(event.target.value) : event.target.value,
    }));
  };

  const updateReadiness = (key) => (event) => {
    setReadiness((prev) => ({ ...prev, [key]: Number(event.target.value) }));
  };

  const updateDraft = (exerciseId, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], [key]: value },
    }));
  };

  const saveExercise = (exercise) => {
    const draft = drafts[exercise.id] || {};
    const weight = Number(draft.weight);
    const reps = Number(draft.reps);
    const rir = Number(draft.rir);

    if (!Number.isFinite(weight) || weight < 0 || !Number.isFinite(reps) || reps <= 0 || !Number.isFinite(rir) || rir < 0) {
      return;
    }

    const entry = {
      id: `${Date.now()}-${exercise.id}`,
      createdAt: new Date().toISOString(),
      session: session.label,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weight,
      reps,
      rir,
    };

    setLogs((prev) => [...prev, entry].slice(-250));
    setDrafts((prev) => ({ ...prev, [exercise.id]: {} }));
  };

  return (
    <main className="app-shell">
      <div className="container">
        <header className="header">
          <div>
            <p className="eyebrow">MOTOR FITNESS 2.0</p>
            <h1>Entrenamiento que se ajusta solo.</h1>
            <p className="subtitle">
              Perfil → rutina → registro → progresión. Todo se recalcula al cambiar tus datos o tu recuperación.
            </p>
          </div>
          <div className="pill">Guardado local automático</div>
        </header>

        <div className="layout">
          <aside className="card sidebar">
            <h2 className="section-title">PERFIL</h2>

            <Field label="PESO (KG)">
              <input className="control" type="number" min="35" max="250" value={profile.peso} onChange={updateProfile("peso")} />
            </Field>
            <Field label="ESTATURA (CM)">
              <input className="control" type="number" min="120" max="230" value={profile.estatura} onChange={updateProfile("estatura")} />
            </Field>
            <Field label="EDAD">
              <input className="control" type="number" min="14" max="90" value={profile.edad} onChange={updateProfile("edad")} />
            </Field>
            <Field label="SEXO">
              <select className="control" value={profile.sexo} onChange={updateProfile("sexo")}>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </select>
            </Field>
            <Field label="EXPERIENCIA">
              <select className="control" value={profile.experiencia} onChange={updateProfile("experiencia")}>
                <option value="nunca">Principiante</option>
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
              </select>
            </Field>
            <Field label="OBJETIVO">
              <select className="control" value={profile.objetivo} onChange={updateProfile("objetivo")}>
                <option value="hipertrofia">Hipertrofia</option>
                <option value="fuerza">Fuerza</option>
                <option value="perdida">Pérdida de grasa</option>
              </select>
            </Field>
            <Field label="DÍAS / SEMANA">
              <select className="control" value={profile.dias} onChange={updateProfile("dias")}>
                {[2, 3, 4, 5, 6].map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </Field>
            <Field label="ACTIVIDAD FUERA DEL GYM">
              <select className="control" value={profile.actividad} onChange={updateProfile("actividad")}>
                <option value="sedentario">Sedentaria</option>
                <option value="ligero">Ligera</option>
                <option value="activo">Activa</option>
              </select>
            </Field>
            <Field label="EQUIPO">
              <select className="control" value={profile.equipo} onChange={updateProfile("equipo")}>
                <option value="gym">Gimnasio completo</option>
                <option value="home">Casa / mancuernas</option>
              </select>
            </Field>
            <Field label="DURACIÓN POR SESIÓN">
              <select className="control" value={profile.duracion} onChange={updateProfile("duracion")}>
                {[45, 60, 75, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
              </select>
            </Field>
          </aside>

          <section className="stack">
            <div className="card">
              <h2 className="section-title">RESUMEN AUTOMÁTICO</h2>
              <div className="metrics">
                <Metric label="BMR" value={nutrition.bmr} unit="kcal / día" />
                <Metric label="TDEE" value={nutrition.tdee} unit="kcal / día" />
                <Metric label="META" value={nutrition.target} unit="kcal / día" accent />
                <Metric label="SPLIT" value={plan.name} unit={`${plan.sessions.length} sesiones`} />
              </div>
              <div className="macro-row">
                <div className="macro"><span>PROTEÍNA</span><strong>{nutrition.macros.protein} g</strong></div>
                <div className="macro"><span>GRASAS</span><strong>{nutrition.macros.fat} g</strong></div>
                <div className="macro"><span>CARBOS</span><strong>{nutrition.macros.carbs} g</strong></div>
              </div>
            </div>

            <div className="card">
              <h2 className="section-title">CHECK-IN DE RECUPERACIÓN</h2>
              <div className="readiness-grid">
                <Field label="ENERGÍA · 1 BAJA / 5 ALTA">
                  <div className="range-line">
                    <input type="range" min="1" max="5" value={readiness.energia} onChange={updateReadiness("energia")} />
                    <span className="range-value">{readiness.energia}</span>
                  </div>
                </Field>
                <Field label="SUEÑO · 1 MALO / 5 BUENO">
                  <div className="range-line">
                    <input type="range" min="1" max="5" value={readiness.sueno} onChange={updateReadiness("sueno")} />
                    <span className="range-value">{readiness.sueno}</span>
                  </div>
                </Field>
                <Field label="DOLOR / AGUJETAS · 1 BAJO / 5 ALTO">
                  <div className="range-line">
                    <input type="range" min="1" max="5" value={readiness.dolor} onChange={updateReadiness("dolor")} />
                    <span className="range-value">{readiness.dolor}</span>
                  </div>
                </Field>
              </div>
              <div className="readiness-status">
                <span>Estado del entrenamiento</span>
                <strong className={`status-${plan.readiness.status}`}>{plan.readiness.label} · {plan.readiness.score}/15</strong>
              </div>
            </div>

            <div className="card">
              <h2 className="section-title">RUTINA GENERADA</h2>
              <div className="session-tabs">
                {plan.sessions.map((item, index) => (
                  <button
                    type="button"
                    key={item.label}
                    className={`tab ${index === activeDay ? "active" : ""}`}
                    onClick={() => setActiveDay(index)}
                  >
                    Día {index + 1}
                  </button>
                ))}
              </div>

              <div className="session-head">
                <h2>{session.label}</h2>
                <span>{GOAL_LABELS[profile.objetivo]} · {EXPERIENCE_LABELS[profile.experiencia]}</span>
              </div>

              <div className="exercise-list">
                {session.exercises.map((exercise) => {
                  const previous = lastByExercise[exercise.id];
                  const advice = nextLoadAdvice(exercise, previous);
                  const draft = drafts[exercise.id] || {};
                  const p = exercise.prescription;

                  return (
                    <article className="exercise" key={exercise.id}>
                      <div className="exercise-top">
                        <div>
                          <div className="exercise-name">{exercise.name}</div>
                          <div className="exercise-group">{exercise.group} · {exercise.type === "compound" ? "Compuesto" : "Aislamiento"}</div>
                        </div>
                        <div>
                          <div className="prescription">{p.sets} × {p.min}-{p.max} · RIR {p.rir}</div>
                          <div className="exercise-meta">Descanso {formatRest(p.rest)}</div>
                        </div>
                      </div>

                      <div className="log-grid">
                        <div>
                          <label>CARGA KG</label>
                          <input
                            className="log-input"
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder={advice.nextWeight ?? "0"}
                            value={draft.weight ?? ""}
                            onChange={(e) => updateDraft(exercise.id, "weight", e.target.value)}
                          />
                        </div>
                        <div>
                          <label>REPS MÍN.</label>
                          <input
                            className="log-input"
                            type="number"
                            min="1"
                            max="50"
                            placeholder={`${p.min}-${p.max}`}
                            value={draft.reps ?? ""}
                            onChange={(e) => updateDraft(exercise.id, "reps", e.target.value)}
                          />
                        </div>
                        <div>
                          <label>RIR REAL</label>
                          <input
                            className="log-input"
                            type="number"
                            min="0"
                            max="8"
                            placeholder={p.rir}
                            value={draft.rir ?? ""}
                            onChange={(e) => updateDraft(exercise.id, "rir", e.target.value)}
                          />
                        </div>
                        <button type="button" className="save-btn" onClick={() => saveExercise(exercise)}>Guardar</button>
                      </div>

                      <div className="advice">
                        <span>{previous ? `Último: ${previous.weight} kg × ${previous.reps} · RIR ${previous.rir}` : "Sin historial todavía"}</span>
                        <strong>{advice.action}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h2 className="section-title">HISTORIAL RECIENTE</h2>
              {logs.length === 0 ? (
                <div className="empty">Cuando guardes ejercicios aparecerán aquí y el motor empezará a recomendar la siguiente carga.</div>
              ) : (
                <div className="history">
                  {[...logs].reverse().slice(0, 8).map((log) => (
                    <div className="history-row" key={log.id}>
                      <div className="history-main">
                        <strong>{log.exerciseName}</strong>
                        <span>{log.session}</span>
                      </div>
                      <div className="history-date">
                        {log.weight} kg · {log.reps} reps · RIR {log.rir}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <p className="footer-note">
                Motor orientativo: las calorías son una estimación y la progresión usa doble progresión simplificada. Dolor agudo, lesión, mareo o síntomas inusuales deben prevalecer sobre cualquier recomendación automática.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
