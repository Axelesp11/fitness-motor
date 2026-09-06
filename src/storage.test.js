import { describe, expect, it } from "vitest";
import { createDefaultState, parseImportedState, sanitizeState, SCHEMA_VERSION } from "./storage.js";

describe("storage schema", () => {
  it("normalizes imported state to schema v3", () => {
    const state = sanitizeState({
      profile: { edad: 10, peso: 500, dias: 9 },
      readiness: { energia: 9, sueno: 0, dolor: 3 },
    });
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.profile.edad).toBe(18);
    expect(state.profile.peso).toBe(250);
    expect(state.profile.dias).toBe(6);
    expect(state.readiness.energia).toBe(5);
  });

  it("persists expanded programming goals and PR lift selection", () => {
    const state = sanitizeState({
      profile: { objetivo: "pr", prLift: "deadlift", dias: 4 },
    });
    expect(state.profile.objetivo).toBe("pr");
    expect(state.profile.prLift).toBe("deadlift");
  });

  it("round trips a valid backup", () => {
    const initial = createDefaultState();
    const parsed = parseImportedState(JSON.stringify(initial));
    expect(parsed.profile).toEqual(initial.profile);
  });

  it("rejects malformed JSON", () => {
    expect(() => parseImportedState("not-json")).toThrow();
  });
});
