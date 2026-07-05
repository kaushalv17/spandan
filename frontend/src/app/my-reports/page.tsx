"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { ObservationCard } from "@/components/ObservationCard";
import { Spinner } from "@/components/Spinner";
import { listObservations } from "@/lib/api";
import type { Observation } from "@/lib/types";

export default function MyReportsPage() {
  const [items, setItems] = useState<Observation[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listObservations({ limit: 50 })
      .then((r) => setItems(r.observations))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load reports."),
      );
  }, []);

  return (
    <Protected>
      <AppShell>
        <h1 className="text-2xl font-bold text-slate-900">My reports</h1>
        <div className="mt-4 space-y-3">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {items === null && !error ? <Spinner label="Loading…" /> : null}
          {items && items.length === 0 ? (
            <p className="text-sm text-slate-500">
              No reports yet. Head to “Report” to submit your first one.
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
