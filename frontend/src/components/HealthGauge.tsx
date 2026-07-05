import { shiColor } from "@/lib/health";
import { formatShi } from "@/lib/format";

export function HealthGauge({
  shi,
  size = 140,
}: {
  shi: number | null;
  size?: number;
}) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = shi ?? 0;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const color = shi === null ? "#cbd5e1" : shiColor(value);
  const wrapperStyle = { width: size, height: size };
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={wrapperStyle}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-slate-800">
          {formatShi(shi)}
        </span>
        <span className="text-xs text-slate-500">SHI</span>
      </div>
    </div>
  );
}
