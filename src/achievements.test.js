import { describe, expect, it } from "vitest";
import { trainingAchievements } from "./achievements.js";

describe("training achievements", () => {
  it("counts finished sessions, advances ranks, and ignores duplicate session IDs", () => {
    const sessionCompletions = Array.from({ length: 5 }, (_, index) => ({ id: `done-${index}`, sessionId: `session-${index}` }));
    sessionCompletions.push({ id: "duplicate", sessionId: "session-1" });
    const result = trainingAchievements({ sessionCompletions });
    expect(result.sessions).toBe(5);
    expect(result.rank.name).toBe("Constante");
    expect(result.nextRank.name).toBe("Intermedio");
    expect(result.milestones.find((item) => item.id === "five").unlocked).toBe(true);
  });

  it("recognizes recorded habits without rewarding a calorie or sleep target", () => {
    const bodyLogs = Array.from({ length: 7 }, (_, index) => ({ date: `2026-09-${String(index + 1).padStart(2, "0")}`, sleepHours: 6.5, calories: 2300 }));
    const result = trainingAchievements({ bodyLogs });
    expect(result.milestones.find((item) => item.id === "habits").unlocked).toBe(true);
    expect(result.rank.name).toBe("Noob");
  });
});
