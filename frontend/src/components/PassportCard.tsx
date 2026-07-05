import Link from "next/link";
import { HealthGauge } from "./HealthGauge";
import { BandPill } from "./BandPill";
import { RiskBadge } from "./RiskBadge";
import { formatRul, formatDate } from "@/lib/format";
import { bandForShi } from "@/lib/health";
import type { AssetPassport } from "@/lib/types";

export function PassportCard({ passport }: { passport: AssetPassport }) {
  const { asset, currentHealth, forecast, risk } = passport;
  const shi = currentHealth?.shi ?? null;
  const band = currentHealth?.band ?? (shi !== null ? bandForShi(shi) : null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/assets/${asset.id}`}
            className="text-lg font-semibold text-slate-900 hover:underline"
          >
            {asset.name}
          </Link>
          <p className="text-sm capitalize text-slate-500">
            {asset.assetType}
            {asset.address ? ` · ${asset.address}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {band ? (
              <BandPill band={band} />
            ) : (
              <span className="text-xs text-slate-400">No health data</span>
            )}
            {risk ? (
              <RiskBadge priority={risk.priority} score={risk.riskScore} />
            ) : null}
          </div>
        </div>
        <HealthGauge shi={shi} size={96} />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <dt className="text-xs text-slate-500">Est. useful life</dt>
          <dd className="text-sm font-semibold">
            {formatRul(forecast?.rulDays)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Importance</dt>
          <dd className="text-sm font-semibold">{asset.importance}/5</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Last checked</dt>
          <dd className="text-sm font-semibold">
            {formatDate(currentHealth?.recordedAt)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
