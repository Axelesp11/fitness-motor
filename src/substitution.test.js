import { describe, expect, it } from "vitest";
import { applyExerciseSubstitutions, substitutionKey, substitutionOptions } from "./substitution.js";

const plan = {
  sessions: [
    {
      label: "Día 1",
      template: "upper",
      exercises: [
        { id: "bench", name: "Press banca", group: "Pecho", type: "compound", prescription: { sets: 3, min: 6, max: 10, rir: 2 }, secondary: [] },
        { id: "row", name: "Remo", group: "Espalda", type: "compound", prescription: { sets: 3, min: 6, max: 10, rir: 2 }, secondary: [] },
      ],
    },
    {
      label: "Día 2",
      template: "upper",
      exercises: [
        { id: "incline", name: "Press inclinado", group: "Pecho", type: "compound", prescription: { sets: 3, min: 6, max: 10, rir: 2 }, secondary: [] },
      ],
    },
  ],
  weeklyVolume: { Pecho: 6, Espalda: 3 },
};

describe("exercise substitutions", () => {
  it("solo ofrece alternativas del mismo grupo y tipo", () => {
    const options = substitutionOptions(plan, plan.sessions[0].exercises[0]);
    expect(options.map((item) => item.id)).toEqual(["bench", "incline"]);
    expect(options.some((item) => item.id === "row")).toBe(false);
  });

  it("aplica una sustitución persistente sin alterar la prescripción", () => {
    const source = plan.sessions[0].exercises[0];
    const key = substitutionKey(plan.sessions[0], source);
    const next = applyExerciseSubstitutions(plan, { [key]: "incline" });
    const item = next.sessions[0].exercises[0];
    expect(item.id).toBe("incline");
    expect(item.prescription.sets).toBe(3);
    expect(item.substitutionSourceId).toBe("bench");
  });
});
