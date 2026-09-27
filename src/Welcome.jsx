import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ACTIVITY_LABELS, EQUIPMENT_LABELS } from "./engine.js";
import { PROGRAM_GOAL_LABELS, PR_LIFT_OPTIONS } from "./programming.js";
import { TRAINING_HISTORY } from "./learning.js";
import { buildOnboardingProfile, onboardingError, WEEKDAYS } from "./onboarding.js";

const TOTAL_STEPS = 5;
const GOALS = ["hipertrofia", "fuerza", "perdida", "pr", "potencia", "resistencia"];

export default function Welcome({ onComplete, onRestore }) {
  const [step, setStep] = useState(0);
  const [trained, setTrained] = useState(null);
  const [answers, setAnswers] = useState({ history: "", edad: "", estatura: "", peso: "", sexo: "", actividad: "", objetivo: "", prLift: "", weekDays: [], equipo: "", duracion: "", mode: "guided" });
  const [error, setError] = useState("");
  const titleRef = useRef(null);

  useEffect(() => titleRef.current?.focus(), [step]);
  const setAnswer = (key, value) => { setAnswers((current) => ({ ...current, [key]: value })); setError(""); };
  const next = () => {
    const issue = onboardingError(step, answers);
    if (issue) { setError(issue); return; }
    if (step === TOTAL_STEPS - 1) onComplete(buildOnboardingProfile(answers));
    else { setError(""); setStep((current) => current + 1); }
  };
  const toggleDay = (day) => {
    const selected = answers.weekDays.includes(day);
    if (!selected && answers.weekDays.length === 6) { setError("Puedes elegir hasta 6 días. Deja al menos uno para descansar."); return; }
    setAnswer("weekDays", selected ? answers.weekDays.filter((item) => item !== day) : [...answers.weekDays, day]);
  };

  return <div className="welcome-layer"><motion.section className="welcome-panel" role="dialog" aria-modal="true" aria-labelledby="welcome-title" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
    <div className="welcome-progress" aria-label={`Paso ${step + 1} de ${TOTAL_STEPS}`}>{Array.from({ length: TOTAL_STEPS }, (_, index) => <span key={index} className={index <= step ? "active" : ""} />)}</div>
    <span className="welcome-kicker">TU PLAN · PASO {step + 1} DE {TOTAL_STEPS}</span>
    {step === 0 && <>
      <h1 id="welcome-title" tabIndex={-1} ref={titleRef}>¿Has entrenado antes?</h1>
      <p>Empezamos desde cero para preparar una rutina a tu medida.</p>
      <div className="welcome-options"><button type="button" aria-pressed={trained === false} onClick={() => { setTrained(false); setAnswer("history", "none"); }}><strong>No, apenas comienzo</strong><span>Aprenderás lo esencial a tu ritmo.</span></button><button type="button" aria-pressed={trained === true} onClick={() => { setTrained(true); setAnswer("history", ""); }}><strong>Sí, ya he entrenado</strong><span>Cuéntanos cuánto tiempo llevas.</span></button></div>
      {trained === true && <div className="welcome-duration"><h2>¿Durante cuánto tiempo?</h2><div>{TRAINING_HISTORY.map(([id, label]) => <button key={id} type="button" aria-pressed={answers.history === id} onClick={() => setAnswer("history", id)}>{label}</button>)}</div></div>}
      {onRestore && <button className="welcome-restore" type="button" onClick={onRestore}>Recuperar mis datos anteriores</button>}
    </>}
    {step === 1 && <>
      <h1 id="welcome-title" tabIndex={-1} ref={titleRef}>Conozcamos tus datos</h1>
      <p>Los usamos para estimar energía y adaptar tu plan. Ningún campo viene con valores inventados.</p>
      <div className="welcome-fields">
        <label>¿Cuántos años tienes?<input type="number" inputMode="numeric" min="18" max="90" value={answers.edad} onChange={(event) => setAnswer("edad", event.target.value)} placeholder="Edad en años" /></label>
        <label>¿Cuánto mides? (cm)<input type="number" inputMode="numeric" min="120" max="230" value={answers.estatura} onChange={(event) => setAnswer("estatura", event.target.value)} placeholder="Estatura en cm" /></label>
        <label>¿Cuánto pesas? (kg)<input type="number" inputMode="decimal" min="35" max="250" step="0.1" value={answers.peso} onChange={(event) => setAnswer("peso", event.target.value)} placeholder="Peso en kg" /></label>
        <label>Opción para estimar gasto energético<select value={answers.sexo} onChange={(event) => setAnswer("sexo", event.target.value)}><option value="">Selecciona una</option><option value="hombre">Hombre</option><option value="mujer">Mujer</option></select></label>
        <label className="wide">Tu actividad fuera del entrenamiento<select value={answers.actividad} onChange={(event) => setAnswer("actividad", event.target.value)}><option value="">Selecciona una</option>{Object.entries(ACTIVITY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </div>
    </>}
    {step === 2 && <>
      <h1 id="welcome-title" tabIndex={-1} ref={titleRef}>¿Qué quieres lograr?</h1>
      <p>Elige un objetivo principal. Podrás cambiarlo más adelante.</p>
      <div className="welcome-options welcome-goals">{GOALS.slice(0, 3).map((id) => <button key={id} type="button" aria-pressed={answers.objetivo === id} onClick={() => setAnswer("objetivo", id)}><strong>{PROGRAM_GOAL_LABELS[id]}</strong></button>)}</div>
      <details className="welcome-extra" open={GOALS.slice(3).includes(answers.objetivo) ? true : undefined}><summary>Más objetivos</summary><div className="welcome-options welcome-goals">{GOALS.slice(3).map((id) => <button key={id} type="button" aria-pressed={answers.objetivo === id} onClick={() => setAnswer("objetivo", id)}><strong>{PROGRAM_GOAL_LABELS[id]}</strong></button>)}</div></details>
      {answers.objetivo === "pr" && <label className="welcome-single-field">¿Qué levantamiento quieres mejorar?<select value={answers.prLift} onChange={(event) => setAnswer("prLift", event.target.value)}><option value="">Selecciona uno</option>{PR_LIFT_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>}
    </>}
    {step === 3 && <>
      <h1 id="welcome-title" tabIndex={-1} ref={titleRef}>Arma tu semana</h1>
      <p>Elige de 2 a 6 días. El plan se organizará según los días que realmente puedes entrenar.</p>
      <div className="welcome-weekdays" role="group" aria-label="Días de entrenamiento">{WEEKDAYS.map(([id, label]) => <button key={id} type="button" aria-pressed={answers.weekDays.includes(id)} onClick={() => toggleDay(id)}>{label}</button>)}</div>
      <span className="welcome-count">{answers.weekDays.length} de 6 días seleccionados</span>
      <div className="welcome-fields"><label>¿Dónde entrenarás?<select value={answers.equipo} onChange={(event) => setAnswer("equipo", event.target.value)}><option value="">Selecciona tu equipo</option>{Object.entries(EQUIPMENT_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>¿Cuánto tiempo por sesión?<select value={answers.duracion} onChange={(event) => setAnswer("duracion", event.target.value)}><option value="">Selecciona duración</option>{[45, 60, 75, 90].map((value) => <option key={value} value={value}>{value} minutos</option>)}</select></label></div>
    </>}
    {step === 4 && <>
      <h1 id="welcome-title" tabIndex={-1} ref={titleRef}>Elige tu ritmo</h1>
      <p>Tu plan está listo. Elige cómo quieres ver las explicaciones mientras entrenas.</p>
      <div className="welcome-options"><button type="button" aria-pressed={answers.mode === "guided"} onClick={() => setAnswer("mode", "guided")}><strong>Guiado</strong><span>Un ejercicio a la vez; los conceptos se muestran poco a poco.</span></button><button type="button" aria-pressed={answers.mode === "advanced"} onClick={() => setAnswer("mode", "advanced")}><strong>Avanzado</strong><span>Rutina completa, series, RIR y progresión desde el inicio.</span></button></div>
      <div className="welcome-summary"><strong>Tu punto de partida</strong><span>{PROGRAM_GOAL_LABELS[answers.objetivo]} · {answers.weekDays.length} días por semana · {answers.duracion} min por sesión</span><span>{answers.history === "none" ? "Primera experiencia" : "Con experiencia previa"} · {EQUIPMENT_LABELS[answers.equipo]}</span></div>
      <small>Puedes ajustar tus respuestas más tarde.</small>
    </>}
    {error && <p className="welcome-error" role="alert">{error}</p>}
    <div className="welcome-actions">{step > 0 && <button type="button" className="welcome-back" onClick={() => { setError(""); setStep((current) => current - 1); }}>Atrás</button>}<button type="button" className="primary-btn" onClick={next}>{step === TOTAL_STEPS - 1 ? "Crear mi plan" : "Continuar"}</button></div>
  </motion.section></div>;
}
