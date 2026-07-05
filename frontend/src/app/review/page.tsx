"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { ObservationCard } from "@/components/ObservationCard";
import { Spinner } from "@/components/Spinner";
import { listObservations } from "@/lib/api";
import type { Observation, ObservationStatus } from "@/lib/types";

type Filter = ObservationStatus | "all";

const FILTERS: Array<{ label: string; value: Filter }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processed", value: "processed" },
  { label: "Failed", value: "failed" },
];

export default function ReviewPage() {
  const [status, setStatus] = useState<Filter>("all");
  const [items, setItems] = useState<Observation[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(null);
    setError("");
    const params = status === "all" ? { limit: 50 } : { status, limit: 50 };
    listObservations(params)
      .then((r) => setItems(r.observations))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load."),
      );
  }, [status]);

  return (
    <Protected requireAuthority>
      <AppShell>
        <h1 className="text-2xl font-bold text-slate-900">Review queue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Citizen observations flowing into the grid.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = status === f.value;
            const cls = active
              ? "bg-slate-900 text-white"
              : "border border-slate-200 bg-white text-slate-600";
            return (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                className={`rounded-full px-3 py-1 text-sm font-medium ${cls}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {items === null && !error ? <Spinner label="Loading…" /> : null}
          {items && items.length === 0 ? (
            <p className="text-sm text-slate-500">
              No observations in this view.
            </p>
          ) : null}
          {items?.map((o) => (
            <ObservationCard key={o.id} observation={o} />
          ))}
        </div>
      </AppShell>
    </Protected>
  );
}
