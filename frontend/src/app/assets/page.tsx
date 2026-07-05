"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { AssetMap, type AssetMapPoint } from "@/components/AssetMap";
import { PassportCard } from "@/components/PassportCard";
import { Spinner } from "@/components/Spinner";
import { listAssets, getAssetPassport } from "@/lib/api";
import type { AssetPassport } from "@/lib/types";

export default function AssetsPage() {
  const [passports, setPassports] = useState<AssetPassport[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { assets } = await listAssets({ limit: 50 });
        const results = await Promise.all(
          assets.map((a) => getAssetPassport(a.id).catch(() => null)),
        );
        setPassports(results.filter((p): p is AssetPassport => p !== null));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load assets.");
      }
    })();
  }, []);

  const points: AssetMapPoint[] = (passports ?? []).map((p) => ({
    asset: p.asset,
    shi: p.currentHealth?.shi ?? null,
  }));

  return (
    <Protected>
      <AppShell>
        <h1 className="text-2xl font-bold text-slate-900">Public assets</h1>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {passports === null && !error ? (
          <div className="mt-4">
            <Spinner label="Loading assets…" />
          </div>
        ) : null}
        {passports ? (
          <>
            {points.length ? (
              <div className="mt-4">
                <AssetMap points={points} />
              </div>
            ) : null}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {passports.map((p) => (
                <PassportCard key={p.asset.id} passport={p} />
              ))}
            </div>
            {passports.length === 0 ? (
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
