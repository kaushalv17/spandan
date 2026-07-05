"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { HealthGauge } from "@/components/HealthGauge";
import { BandPill } from "@/components/BandPill";
import { RiskBadge } from "@/components/RiskBadge";
import { TrendChart } from "@/components/TrendChart";
import { DefectList } from "@/components/DefectList";
import { Spinner } from "@/components/Spinner";
import { getAssetPassport } from "@/lib/api";
import { formatRul, formatDate } from "@/lib/format";
import { bandForShi } from "@/lib/health";
import type { AssetPassport } from "@/lib/types";

export default function AssetDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [passport, setPassport] = useState<AssetPassport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAssetPassport(id)
      .then(setPassport)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load asset."),
      );
  }, [id]);

  return (
    <Protected>
      <AppShell>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!passport && !error ? <Spinner label="Loading asset…" /> : null}
        {passport ? <PassportDetail passport={passport} /> : null}
      </AppShell>
    </Protected>
  );
}

function PassportDetail({ passport }: { passport: AssetPassport }) {
  const { asset, currentHealth, forecast, risk, history, recentDefects } =
    passport;
  const shi = currentHealth?.shi ?? null;
  const band = currentHealth?.band ?? (shi !== null ? bandForShi(shi) : null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{asset.name}</h1>
        <p className="text-sm capitalize text-slate-500">
          {asset.assetType}
          {asset.address ? ` · ${asset.address}` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5">
          <HealthGauge shi={shi} />
          {band ? (
            <div className="mt-2">
              <BandPill band={band} />
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Risk &amp; forecast
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {risk ? (
              <RiskBadge priority={risk.priority} score={risk.riskScore} />
            ) : (
              <span className="text-sm text-slate-400">
                No risk assessment yet.
              </span>
            )}
          </div>
          {risk && risk.reasons.length ? (
            <ul className="mt-3 list-inside list-disc text-sm text-slate-600">
              {risk.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : null}
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <dt className="text-xs text-slate-500">Useful life</dt>
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
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700">
          Health trend (SHI)
        </h2>
        <div className="mt-3">
          <TrendChart history={history} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700">Recent defects</h2>
        <div className="mt-3">
          <DefectList defects={recentDefects} />
        </div>
      </div>
    </div>
  );
}
