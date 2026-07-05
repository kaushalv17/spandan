"use client";

import { useCallback, useEffect } from "react";
import { allQueued, dequeue } from "./offlineQueue";
import { submitObservation } from "./api";
import { useOnlineStatus } from "./useOnlineStatus";

// Flushes any offline-queued observations to the backend when connectivity
// returns. Stops on the first failure and retries on the next online cycle.
export function useQueueSync(onSynced?: () => void): void {
  const online = useOnlineStatus();

  const flush = useCallback(async () => {
    const items = await allQueued().catch(() => []);
    let synced = 0;
    for (const item of items) {
      try {
        await submitObservation({
          imageUrl: item.imageUrl,
          note: item.note,
          location: item.location,
          assetId: item.assetId,
        });
        await dequeue(item.id);
        synced += 1;
      } catch {
        break;
      }
    }
    if (synced > 0 && onSynced) onSynced();
  }, [onSynced]);

  useEffect(() => {
    if (!online) return;
    void flush();
  }, [online, flush]);
}
