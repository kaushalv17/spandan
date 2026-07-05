import { describe, expect, it } from "vitest";
import { severityFromArea } from "./severity.js";

describe("severityFromArea", () => {
  it("classifies large detections as high severity", () => {
    expect(severityFromArea(0.2)).toBe("high");
    expect(severityFromArea(0.15)).toBe("high");
  });

  it("classifies mid-sized detections as medium severity", () => {
    expect(severityFromArea(0.1)).toBe("medium");
    expect(severityFromArea(0.05)).toBe("medium");
  });

  it("classifies small detections as low severity", () => {
    expect(severityFromArea(0.04)).toBe("low");
    expect(severityFromArea(0.0)).toBe("low");
  });
});
