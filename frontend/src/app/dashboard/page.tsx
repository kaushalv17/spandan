"use client";

import { useEffect, useMemo, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { AssetMap, type AssetMapPoint } from "@/components/AssetMap";
import { PassportCard } from "@/components/PassportCard";
import { Spinner } from "@/components/Spinner";
import { listAssets, getAssetPassport } from "@/lib/api";
import { priorityRank } from "@/lib/risk";
import type { AssetPassport, RiskPriority } from "@/lib/types";

export default function DashboardPage() {
  const [passports, setPassports] = useState<AssetPassport[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { assets } = await listAssets({ limit: 100 });
        const results = await Promise.all(
          assets.map((a) => getAssetPassport(a.id).catch(() => null)),
        );
        setPassports(results.filter((p): p is AssetPassport => p !== null));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    if (!passports) return [];
    return [...passports].sort((a, b) => {
      const ap = a.risk ? priorityRank(a.risk.priority) : 99;
      const bp = b.risk ? priorityRank(b.risk.priority) : 99;
      if (ap !== bp) return ap - bp;
      return (b.risk?.riskScore ?? 0) - (a.risk?.riskScore ?? 0);
    });
  }, [passports]);

  const counts = useMemo(() => {
    const tally: Record<RiskPriority, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
    for (const p of sorted) if (p.risk) tally[p.risk.priority] += 1;
    return tally;
  }, [sorted]);

  const points: AssetMapPoint[] = sorted.map((p) => ({
    asset: p.asset,
    shi: p.currentHealth?.shi ?? null,
  }));

  const priorities: RiskPriority[] = ["P0", "P1", "P2", "P3"];

  return (
    <Protected requireAuthority>
      <AppShell>
        <h1 className="text-2xl font-bold text-slate-900">
          Maintenance dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Assets ranked by AI risk priority — act on P0/P1 first.
        </p>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {passports === null && !error ? (
          <div className="mt-4">
            <Spinner label="Loading…" />
          </div>
        ) : null}

        {passports ? (
          <>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {priorities.map((p) => (
                <div
                  key={p}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-center"
                >
                  <p className="text-2xl font-bold text-slate-900">
                    {counts[p]}
                  </p>
                  <p className="text-xs text-slate-500">{p}</p>
                </div>
              ))}
            </div>
            {points.length ? (
              <div className="mt-4">
                <AssetMap points={points} />
              </div>
            ) : null}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {sorted.map((p) => (
                <PassportCard key={p.asset.id} passport={p} />
              ))}
            </div>
            {sorted.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No assets registered yet.
              </p>
            ) : null}
          </>
        ) : null}
      </AppShell>
    </Protected>
  );
}
