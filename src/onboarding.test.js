import { describe, expect, it } from "vitest";
import { buildOnboardingProfile, onboardingError } from "./onboarding.js";

const valid = {
  history: "none", edad: "24", estatura: "173", peso: "98", sexo: "hombre", actividad: "ligero",
  objetivo: "hipertrofia", prLift: "", weekDays: ["viernes", "lunes", "miercoles"],
  equipo: "gym", duracion: "60", mode: "guided",
};

describe("cuestionario inicial", () => {
  it("no crea un plan con datos corporales o días vacíos", () => {
    expect(onboardingError(1, { ...valid, peso: "" })).toMatch(/peso/i);
    expect(onboardingError(3, { ...valid, weekDays: ["lunes"] })).toMatch(/2 a 6 días/);
    expect(() => buildOnboardingProfile({ ...valid, edad: "" })).toThrow(/edad/);
  });

  it("estima la frecuencia desde los días reales y conserva las elecciones", () => {
    const profile = buildOnboardingProfile(valid);
    expect(profile).toMatchObject({ edad: 24, estatura: 173, peso: 98, dias: 3, trainingHistory: "none", learningMode: "guided", onboardingDone: true });
    expect(profile.weekDays).toEqual(["lunes", "miercoles", "viernes"]);
  });

  it("pide un levantamiento cuando el objetivo es PR", () => {
    expect(onboardingError(2, { ...valid, objetivo: "pr" })).toMatch(/levantamiento/);
  });
});
