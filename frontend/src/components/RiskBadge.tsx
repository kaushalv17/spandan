import { PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/risk";
import type { RiskPriority } from "@/lib/types";

export function RiskBadge({
  priority,
  score,
}: {
  priority: RiskPriority;
  score?: number;
}) {
  const style = { backgroundColor: PRIORITY_COLOR[priority] };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold text-white"
      style={style}
    >
      {priority} · {PRIORITY_LABEL[priority]}
      {score !== undefined ? ` · ${Math.round(score)}` : ""}
    </span>
  );
}
