import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { TRAINING_HISTORY } from "./learning.js";

export default function Welcome({ onComplete }) {
  const [step, setStep] = useState(0);
  const [trained, setTrained] = useState(null);
  const [history, setHistory] = useState(null);
  const [mode, setMode] = useState("guided");
  const firstButton = useRef(null);

  useEffect(() => firstButton.current?.focus(), [step]);

  return <div className="welcome-layer"><motion.section className="welcome-panel" role="dialog" aria-modal="true" aria-labelledby="welcome-title" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
    <div className="welcome-progress" aria-label={`Paso ${step + 1} de 2`}><span className="active"/><span className={step === 1 ? "active" : ""}/></div>
    <span className="welcome-kicker">MOTOR FITNESS · TU PUNTO DE PARTIDA</span>
    {step === 0 ? <>
      <h1 id="welcome-title">¿Has entrenado antes?</h1>
      <p>Con esto elegimos el nivel inicial de tu rutina. Podrás cambiarlo después.</p>
      <div className="welcome-options"><button ref={firstButton} type="button" aria-pressed={trained === false} onClick={() => { setTrained(false); setHistory("none"); setStep(1); }}><strong>No, apenas comienzo</strong><span>Te explicaremos lo esencial poco a poco.</span></button><button type="button" aria-pressed={trained === true} onClick={() => setTrained(true)}><strong>Sí, ya he entrenado</strong><span>Cuéntanos cuánto tiempo llevas.</span></button></div>
      {trained === true && <div className="welcome-duration"><h2>¿Durante cuánto tiempo?</h2><div>{TRAINING_HISTORY.map(([id, label]) => <button key={id} type="button" aria-pressed={history === id} onClick={() => { setHistory(id); setStep(1); }}>{label}</button>)}</div></div>}
    </> : <>
      <h1 id="welcome-title">Aprende a tu ritmo</h1>
      <p>El plan usa tu experiencia estimada. Tú decides cuánto detalle quieres ver mientras entrenas.</p>
      <div className="welcome-options"><button ref={firstButton} type="button" aria-pressed={mode === "guided"} onClick={() => setMode("guided")}><strong>Guiado</strong><span>Un ejercicio a la vez. Primero lo básico; después, más conceptos.</span></button><button type="button" aria-pressed={mode === "advanced"} onClick={() => setMode("advanced")}><strong>Avanzado</strong><span>Rutina completa, series, RIR y progresión desde el inicio.</span></button></div>
      <div className="welcome-actions"><button type="button" className="welcome-back" onClick={() => setStep(0)}>Atrás</button><button type="button" className="primary-btn" onClick={() => onComplete({ history: history || "none", mode })}>Ver mi plan</button></div>
      <small>Puedes cambiar el modo y tu experiencia cuando quieras.</small>
    </>}
  </motion.section></div>;
}
