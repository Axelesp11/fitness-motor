import { describe, expect, it } from "vitest";
import { estimateExperience, learningStep, techniqueTip } from "./learning.js";

describe("guided training", () => {
  it("estimates a starting program without equating reading mode with experience", () => {
    expect(estimateExperience("none")).toBe("nunca");
    expect(estimateExperience("under3")).toBe("nunca");
    expect(estimateExperience("3to12")).toBe("basico");
    expect(estimateExperience("over12")).toBe("intermedio");
  });

  it("unlocks concepts gradually and always provides a brief technique cue", () => {
    expect(learningStep(0).title).toMatch(/controla/);
    expect(learningStep(3).detail).toMatch(/RIR/);
    expect(learningStep(6).detail).toMatch(/repeticiones/);
    expect(techniqueTip({ id: "bench_press", type: "compound" })).toMatch(/barra/);
    expect(techniqueTip({ id: "unknown", type: "isolation" })).toMatch(/sin impulso/);
  });
});
