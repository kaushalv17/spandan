import { formatConfidence, formatDefectType, formatPct } from "@/lib/format";
import type { Defect, Severity } from "@/lib/types";

const SEVERITY_COLOR: Record<Severity, string> = {
  low: "bg-yellow-100 text-yellow-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800",
};

export function DefectList({ defects }: { defects: Defect[] }) {
  if (defects.length === 0) {
    return <p className="text-sm text-slate-500">No defects detected.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {defects.map((d) => (
        <li key={d.id} className="flex items-center justify-between py-2">
          <div>
            <p className="font-medium text-slate-800">
              {formatDefectType(d.defectType)}
            </p>
            <p className="text-xs text-slate-500">
              Extent {formatPct(d.extentPct)} · Confidence{" "}
              {formatConfidence(d.confidence)}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${SEVERITY_COLOR[d.severity]}`}
          >
            {d.severity}
          </span>
        </li>
      ))}
    </ul>
  );
}
