import { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";

const C = {
  bg: "#14171C",
  surface: "#1B1F26",
  surface2: "#20242C",
  border: "#2A2F38",
  text: "#ECEDEF",
  muted: "#8B92A0",
  effort: "#FF6B35",
  effortDim: "#4A3226",
  recovery: "#4FD1C5",
  recoveryDim: "#1F3A38",
};

function calcBMR({ peso, estatura, edad, sexo }) {
  const base = 10 * peso + 6.25 * estatura - 5 * edad;
  return sexo === "hombre" ? base + 5 : base - 161;
}

const ACTIVIDAD_BASE = { sedentario: 1.2, ligero: 1.375, activo: 1.55 };
const ENTRENO_ADD = { 2: 0.1, 3: 0.15, 4: 0.2, 5: 0.25, 6: 0.3 };

function calcTDEE(bmr, dias, nivelActividad) {
  const mult = (ACTIVIDAD_BASE[nivelActividad] || 1.2) + (ENTRENO_ADD[dias] || 0.15);
  return Math.round(bmr * mult);
}

function calcCaloriasObjetivo(tdee, objetivo) {
  if (objetivo === "perdida") return Math.round(tdee * 0.82);
  if (objetivo === "hipertrofia") return Math.round(tdee * 1.08);
  return tdee;
}

function calcMacros(calorias, peso, objetivo) {
  const gProteinaPorKg = objetivo === "perdida" ? 2.4 : objetivo === "fuerza" ? 1.8 : 2.0;
  const proteina = Math.round(peso * gProteinaPorKg);
  const grasa = Math.round(peso * 0.8);
  const carbos = Math.round((calorias - proteina * 4 - grasa * 9) / 4);
  return { proteina, grasa, carbos };
}

const PARAM_OBJETIVO = {
  hipertrofia: { series: "3-4", reps: "8-12", descanso: "2-3 min" },
  fuerza: { series: "4-5", reps: "3-6", descanso: "3-5 min" },
  perdida: { series: "3", reps: "12-15", descanso: "45-90s" },
};

const GRUPOS = ["Pecho", "Espalda", "Piernas", "Hombro", "Brazos", "Core"];

function definirSplit(dias, exp) {
  const tope = { nunca: 4, basico: 5, intermedio: 6 }[exp] || 6;
  const d = Math.min(dias, tope);

  if (exp === "nunca" || d <= 3) {
    return { nombre: "Fullbody", sesiones: Array.from({ length: d }, (_, i) => ({ dia: `Día ${i + 1}`, grupos: GRUPOS })) };
  }
  if (d === 4) {
    return { nombre: "Upper/Lower", sesiones: [
      { dia: "Día 1", grupos: ["Pecho", "Espalda", "Hombro", "Brazos"] },
      { dia: "Día 2", grupos: ["Piernas", "Core"] },
      { dia: "Día 3", grupos: ["Pecho", "Espalda", "Hombro", "Brazos"] },
      { dia: "Día 4", grupos: ["Piernas", "Core"] },
    ]};
  }
  if (d === 5) {
    return { nombre: "PPL + Upper/Lower", sesiones: [
      { dia: "Día 1 (Push)", grupos: ["Pecho", "Hombro", "Brazos"] },
      { dia: "Día 2 (Pull)", grupos: ["Espalda", "Brazos"] },
      { dia: "Día 3 (Legs)", grupos: ["Piernas", "Core"] },
      { dia: "Día 4 (Upper)", grupos: ["Pecho", "Espalda", "Hombro", "Brazos"] },
      { dia: "Día 5 (Lower)", grupos: ["Piernas", "Core"] },
    ]};
  }
  return { nombre: "Push/Pull/Legs (x2)", sesiones: [
    { dia: "Día 1 (Push)", grupos: ["Pecho", "Hombro", "Brazos"] },
    { dia: "Día 2 (Pull)", grupos: ["Espalda", "Brazos"] },
    { dia: "Día 3 (Legs)", grupos: ["Piernas", "Core"] },
    { dia: "Día 4 (Push)", grupos: ["Pecho", "Hombro", "Brazos"] },
    { dia: "Día 5 (Pull)", grupos: ["Espalda", "Brazos"] },
    { dia: "Día 6 (Legs)", grupos: ["Piernas", "Core"] },
  ].slice(0, d)};
}

export default function App() {
  const [form, setForm] = useState({
    peso: 75, estatura: 172, edad: 24, sexo: "hombre",
    experiencia: "nunca", objetivo: "hipertrofia", dias: 3, actividad: "sedentario",
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: ["peso", "estatura", "edad", "dias"].includes(k) ? Number(e.target.value) : e.target.value }));

  const resultado = useMemo(() => {
    const bmr = calcBMR(form);
    const tdee = calcTDEE(bmr, form.dias, form.actividad);
    const calorias = calcCaloriasObjetivo(tdee, form.objetivo);
    const macros = calcMacros(calorias, form.peso, form.objetivo);
    const split = definirSplit(form.dias, form.experiencia);
    const params = PARAM_OBJETIVO[form.objetivo];
    return { bmr: Math.round(bmr), tdee, calorias, macros, split, params };
  }, [form]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui", padding: "20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Motor de Cálculo Fitness</h1>
        <p style={{ color: C.muted, marginBottom: 24 }}>Respaldado por ISSN 2017 y Schoenfeld et al.</p>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
          {/* FORM */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, height: "fit-content" }}>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: C.muted, marginBottom: 12, fontWeight: 600 }}>DATOS</div>
            {[
              ["PESO (KG)", "peso", "number"],
              ["ESTATURA (CM)", "estatura", "number"],
              ["EDAD", "edad", "number"],
            ].map(([label, key, type]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6, fontFamily: "monospace" }}>{label}</label>
                <input type={type} value={form[key]} onChange={set(key)} style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, outline: "none" }} />
              </div>
            ))}
            {[
              ["SEXO", "sexo", ["hombre", "mujer"]],
              ["EXPERIENCIA", "experiencia", ["nunca", "basico", "intermedio"]],
              ["OBJETIVO", "objetivo", ["hipertrofia", "fuerza", "perdida"]],
              ["DÍAS/SEMANA", "dias", ["2", "3", "4", "5", "6"]],
              ["ACTIVIDAD", "actividad", ["sedentario", "ligero", "activo"]],
            ].map(([label, key, options]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 6, fontFamily: "monospace" }}>{label}</label>
                <select value={form[key]} onChange={set(key)} style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, outline: "none" }}>
                  {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* RESULTADOS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* METABOLISMO */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <h2 style={{ fontSize: 14, fontFamily: "monospace", color: C.muted, marginBottom: 12 }}>METABOLISMO</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>BMR</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{resultado.bmr}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>kcal/día</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>TDEE</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{resultado.tdee}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>kcal/día</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>META</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.effort }}>{resultado.calorias}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>kcal/día</div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>PROTEÍNA</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{resultado.macros.proteina}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>g/día</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>GRASAS</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{resultado.macros.grasa}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>g/día</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>CARBOS</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{resultado.macros.carbos}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>g/día</div>
                </div>
              </div>
            </div>

            {/* SPLIT */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <h2 style={{ fontSize: 14, fontFamily: "monospace", color: C.muted, marginBottom: 12 }}>SPLIT</h2>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.effort, margin: 0 }}>{resultado.split.nombre}</p>
              <div style={{ marginTop: 12 }}>
                {resultado.split.sesiones.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, background: C.surface2, borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontFamily: "monospace", color: C.effort, fontWeight: 600 }}>{s.dia}</span>
                    <span>{s.grupos.join(" • ")}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "8px 12px", background: C.surface2, borderRadius: 8, fontSize: 11, fontFamily: "monospace", color: C.muted }}>
                Series: {resultado.params.series} | Reps: {resultado.params.reps} | Descanso: {resultado.params.descanso}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
