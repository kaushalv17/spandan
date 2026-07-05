import { describe, expect, it } from "vitest";
import { bandForShi, BAND_COLOR, shiColor } from "./health";

describe("bandForShi", () => {
  it("healthy", () => expect(bandForShi(92)).toBe("Healthy"));
  it("boundary 85 is healthy", () => expect(bandForShi(85)).toBe("Healthy"));
  it("degrading", () => expect(bandForShi(70)).toBe("Degrading"));
  it("boundary 55 is degrading", () =>
    expect(bandForShi(55)).toBe("Degrading"));
  it("critical", () => expect(bandForShi(40)).toBe("Critical"));
  it("boundary 25 is critical", () => expect(bandForShi(25)).toBe("Critical"));
  it("failure risk", () => expect(bandForShi(10)).toBe("Failure-risk"));
});

describe("shiColor", () => {
  it("maps a healthy score to the healthy colour", () =>
    expect(shiColor(92)).toBe(BAND_COLOR.Healthy));
  it("maps a low score to the failure colour", () =>
    expect(shiColor(5)).toBe(BAND_COLOR["Failure-risk"]));
});
