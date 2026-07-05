"use client";

import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { queueCount } from "@/lib/offlineQueue";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      queueCount()
        .then((n) => {
          if (active) setPending(n);
        })
        .catch(() => {});
    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [online]);

  if (online && pending === 0) return null;

  return (
    <div
      className={`px-4 py-2 text-center text-sm font-medium ${
        online ? "bg-amber-100 text-amber-800" : "bg-slate-800 text-white"
      }`}
    >
      {online
        ? `${pending} report${pending === 1 ? "" : "s"} queued — syncing…`
        : `You're offline — reports are saved on this device${
            pending ? ` (${pending} queued)` : ""
          }.`}
    </div>
  );
}
