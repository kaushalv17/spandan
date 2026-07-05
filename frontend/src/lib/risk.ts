import type { RiskPriority } from "./types";

export const PRIORITIES: readonly RiskPriority[] = ["P0", "P1", "P2", "P3"];

export const PRIORITY_COLOR: Record<RiskPriority, string> = {
  P0: "#dc2626",
  P1: "#f97316",
  P2: "#eab308",
  P3: "#16a34a",
};

export const PRIORITY_LABEL: Record<RiskPriority, string> = {
  P0: "Immediate",
  P1: "Urgent",
  P2: "Planned",
  P3: "Monitor",
};

export function priorityColor(priority: RiskPriority): string {
  return PRIORITY_COLOR[priority];
}

export function priorityLabel(priority: RiskPriority): string {
  return PRIORITY_LABEL[priority];
}

// Lower rank = more urgent; used to sort a work queue P0 -> P3.
export function priorityRank(priority: RiskPriority): number {
  return PRIORITIES.indexOf(priority);
}
