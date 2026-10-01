export const TRAINING_HISTORY = [
  ["under3", "Menos de 3 meses"],
  ["3to12", "De 3 a 12 meses"],
  ["over12", "Más de 1 año"],
];

export function estimateExperience(history) {
  if (history === "over12") return "intermedio";
  if (history === "3to12") return "basico";
  return "nunca";
}

export function learningStep(completedSessions) {
  if (completedSessions < 2) return {
    title: "Primero, controla el movimiento",
    detail: "Prueba una carga cómoda. Una serie es un grupo de repeticiones; empieza suave y registra lo que realmente hiciste.",
  };
  if (completedSessions < 6) return {
    title: "Ahora, conoce tu margen",
    detail: "RIR son las repeticiones que crees que todavía podrías hacer con buena técnica. No necesitas llegar al fallo.",
  };
  return {
    title: "Ya puedes seguir tu progresión",
    detail: "Compara tus sesiones: intenta sumar repeticiones dentro del rango y después aumenta la carga si mantienes el control.",
  };
}

const TIPS = {
  bench_press: "Apoya los pies, baja la barra con control y evita rebotarla en el pecho.",
  back_squat: "Mantén los pies firmes, baja con control y conserva el tronco estable.",
  rdl: "Lleva la cadera hacia atrás y mantén la carga cerca de las piernas.",
  lat_pulldown: "Lleva la barra hacia la parte alta del pecho sin impulsarte con el cuerpo.",
  barbell_row: "Mantén el tronco estable y lleva los codos atrás sin balancearte.",
};

export function techniqueTip(exercise) {
  return TIPS[exercise.id] || (exercise.type === "compound"
    ? "Prueba primero con poca carga y mueve el peso con control. Detente si aparece dolor."
    : "Mueve la carga sin impulso y detente si aparece dolor.");
}
