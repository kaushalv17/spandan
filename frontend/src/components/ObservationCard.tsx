import Link from "next/link";
import { relativeTime } from "@/lib/format";
import type { Observation, ObservationStatus } from "@/lib/types";

const STATUS_STYLE: Record<ObservationStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  processing: "bg-blue-100 text-blue-700",
  processed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export function ObservationCard({ observation }: { observation: Observation }) {
  const o = observation;
  return (
    <Link
      href={`/my-reports/${o.id}`}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={o.imageUrl}
        alt="Observation"
        className="h-16 w-16 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {o.note || "Observation"}
        </p>
        <p className="text-xs text-slate-500">{relativeTime(o.createdAt)}</p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[o.status]}`}
      >
        {o.status}
      </span>
    </Link>
  );
}
