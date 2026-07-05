"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { DefectList } from "@/components/DefectList";
import { Spinner } from "@/components/Spinner";
import { getObservation } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Defect, Observation } from "@/lib/types";

const STATUS_TEXT: Record<Observation["status"], string> = {
  pending: "Waiting to be analysed",
  processing: "AI analysis in progress",
  processed: "Analysis complete",
  failed: "Analysis failed",
};

export default function ObservationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<{
    observation: Observation;
    defects: Defect[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getObservation(id)
      .then(setData)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load report."),
      );
  }, [id]);

  return (
    <Protected>
      <AppShell>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!data && !error ? <Spinner label="Loading report…" /> : null}
        {data ? (
          <div className="mx-auto max-w-lg space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.observation.imageUrl}
              alt="Observation"
              className="w-full rounded-2xl border border-slate-200 object-cover"
            />
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-800">
                {STATUS_TEXT[data.observation.status]}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Reported {formatDateTime(data.observation.createdAt)}
              </p>
              {data.observation.note ? (
                <p className="mt-2 text-sm text-slate-600">
                  {data.observation.note}
                </p>
              ) : null}
              {data.observation.error ? (
                <p className="mt-2 text-sm text-red-600">
                  {data.observation.error}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-700">
                Detected defects
              </h2>
              <div className="mt-2">
                <DefectList defects={data.defects} />
              </div>
            </div>
          </div>
        ) : null}
      </AppShell>
    </Protected>
  );
}
