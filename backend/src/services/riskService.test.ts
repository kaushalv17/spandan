import { describe, expect, it } from "vitest";
import { computeRisk } from "./riskService.js";

describe("computeRisk", () => {
  it("keeps a healthy, unimportant asset at the lowest priority", () => {
    const r = computeRisk({
      shi: 92,
      band: "Healthy",
      rulDays: null,
      importance: 3,
    });
    expect(r.priority).toBe("P3");
    expect(r.riskScore).toBeGreaterThanOrEqual(0);
    expect(r.riskScore).toBeLessThan(30);
  });

  it("places a failure-risk asset at P0", () => {
    const r = computeRisk({
      shi: 18,
      band: "Failure-risk",
      rulDays: 0,
      importance: 3,
    });
    expect(r.priority).toBe("P0");
    expect(r.riskScore).toBeGreaterThan(60);
  });

  it("escalates a degrading asset to P0 when failure is imminent", () => {
    const r = computeRisk({
      shi: 60,
      band: "Degrading",
      rulDays: 5,
      importance: 3,
    });
    // base 1 (Degrading) + 2 (<=7 days) = 3 => P0
    expect(r.priority).toBe("P0");
  });

  it("escalates a degrading asset one step at 30-day horizon", () => {
    const r = computeRisk({
      shi: 60,
      band: "Degrading",
      rulDays: 25,
      importance: 3,
    });
    // base 1 + 1 = 2 => P1
    expect(r.priority).toBe("P1");
  });

  it("bumps priority up for critical lifeline assets", () => {
    const base = computeRisk({
      shi: 70,
      band: "Degrading",
      rulDays: null,
      importance: 3,
    });
    const lifeline = computeRisk({
      shi: 70,
      band: "Degrading",
      rulDays: null,
      importance: 5,
    });
    expect(base.priority).toBe("P2");
    expect(lifeline.priority).toBe("P1");
    expect(lifeline.riskScore).toBeGreaterThan(base.riskScore);
  });

  it("de-escalates low-importance assets", () => {
    const r = computeRisk({
      shi: 70,
      band: "Degrading",
      rulDays: null,
      importance: 1,
    });
    expect(r.priority).toBe("P3");
  });

  it("never exceeds the P0 ceiling", () => {
    const r = computeRisk({
      shi: 5,
      band: "Failure-risk",
      rulDays: 1,
      importance: 5,
    });
    expect(r.priority).toBe("P0");
    expect(r.riskScore).toBeLessThanOrEqual(100);
  });
});
