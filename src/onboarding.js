export const WEEKDAYS = [
  ["lunes", "Lun"], ["martes", "Mar"], ["miercoles", "Mié"], ["jueves", "Jue"],
  ["viernes", "Vie"], ["sabado", "Sáb"], ["domingo", "Dom"],
];

export const SUGGESTED_DAYS = {
  2: ["lunes", "jueves"],
  3: ["lunes", "miercoles", "viernes"],
  4: ["lunes", "martes", "jueves", "viernes"],
  5: ["lunes", "martes", "miercoles", "viernes", "sabado"],
  6: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"],
};

const inRange = (value, min, max) => value !== "" && value != null && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;

export function onboardingError(step, answers) {
  if (step === 0 && !["none", "under3", "3to12", "over12"].includes(answers.history)) return "Elige tu experiencia antes de continuar.";
  if (step === 1) {
    if (!inRange(answers.edad, 18, 90)) return "Indica una edad entre 18 y 90 años.";
    if (!inRange(answers.estatura, 120, 230)) return "Indica una estatura entre 120 y 230 cm.";
    if (!inRange(answers.peso, 35, 250)) return "Indica un peso entre 35 y 250 kg.";
    if (!["hombre", "mujer"].includes(answers.sexo)) return "Elige la opción utilizada para estimar tu gasto energético.";
    if (!["sedentario", "ligero", "activo", "muy_activo"].includes(answers.actividad)) return "Indica tu actividad fuera del gimnasio.";
  }
  if (step === 2) {
    if (!["hipertrofia", "fuerza", "pr", "potencia", "resistencia", "perdida"].includes(answers.objetivo)) return "Elige tu objetivo principal.";
    if (answers.objetivo === "pr" && !["bench_press", "back_squat", "deadlift", "overhead_press"].includes(answers.prLift)) return "Elige el levantamiento que quieres mejorar.";
  }
  if (step === 3) {
    if (!Array.isArray(answers.weekDays) || answers.weekDays.length < 2 || answers.weekDays.length > 6 || new Set(answers.weekDays).size !== answers.weekDays.length || answers.weekDays.some((day) => !WEEKDAYS.some(([id]) => id === day))) return "Elige de 2 a 6 días distintos de entrenamiento.";
    if (!["gym", "home", "minimal"].includes(answers.equipo)) return "Elige el equipo que tienes disponible.";
    if (![45, 60, 75, 90].includes(Number(answers.duracion))) return "Elige cuánto tiempo puedes entrenar por sesión.";
  }
  if (step === 4 && !["guided", "advanced"].includes(answers.mode)) return "Elige cómo quieres ver tu rutina.";
  return "";
}

export function buildOnboardingProfile(answers) {
  for (let step = 0; step < 5; step += 1) {
    const error = onboardingError(step, answers);
    if (error) throw new Error(error);
  }
  return {
    edad: Number(answers.edad), estatura: Number(answers.estatura), peso: Number(answers.peso),
    sexo: answers.sexo, actividad: answers.actividad, objetivo: answers.objetivo,
    prLift: answers.objetivo === "pr" ? answers.prLift : "bench_press",
    equipo: answers.equipo, duracion: Number(answers.duracion),
    weekDays: WEEKDAYS.map(([id]) => id).filter((id) => answers.weekDays.includes(id)),
    dias: answers.weekDays.length,
    trainingHistory: answers.history,
    learningMode: answers.mode,
    onboardingDone: true,
  };
}
