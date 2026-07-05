import { describe, expect, it } from "vitest";
import { formatRul, formatShi, formatPct, formatDefectType } from "./format";

describe("formatRul", () => {
  it("handles null", () => expect(formatRul(null)).toBe("\u2014"));
  it("handles overdue", () => expect(formatRul(0)).toBe("Overdue"));
  it("sub-day", () => expect(formatRul(0.5)).toBe("<1 day"));
  it("days", () => expect(formatRul(12)).toBe("12 days"));
  it("months", () => expect(formatRul(90)).toBe("~3 months"));
  it("years", () => expect(formatRul(730)).toBe("~2.0 years"));
});

describe("formatShi / formatPct", () => {
  it("rounds shi", () => expect(formatShi(72.6)).toBe("73"));
  it("formats pct", () => expect(formatPct(15.2)).toBe("15%"));
  it("null shi", () => expect(formatShi(null)).toBe("\u2014"));
});

describe("formatDefectType", () => {
  it("humanises unified classes", () =>
    expect(formatDefectType("alligator_crack")).toBe("Alligator Crack"));
  it("handles exposed_rebar", () =>
    expect(formatDefectType("exposed_rebar")).toBe("Exposed Rebar"));
});
