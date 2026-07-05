import { describe, expect, it } from "vitest";
import {
  priorityRank,
  priorityColor,
  priorityLabel,
  PRIORITY_COLOR,
} from "./risk";

describe("priority helpers", () => {
  it("ranks P0 as most urgent", () => {
    expect(priorityRank("P0")).toBeLessThan(priorityRank("P3"));
    expect(priorityRank("P1")).toBe(1);
  });
  it("maps colours", () => expect(priorityColor("P0")).toBe(PRIORITY_COLOR.P0));
  it("maps labels", () => expect(priorityLabel("P2")).toBe("Planned"));
});
