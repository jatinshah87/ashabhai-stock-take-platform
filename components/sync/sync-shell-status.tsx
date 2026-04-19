"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPendingQueueCount } from "@/lib/offline/sync-queue";

export function SyncShellStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    function refresh() {
      setIsOnline(window.navigator.onLine);
      setPending(getPendingQueueCount());
    }

    async function handleOnline() {
      setRestored(true);
      refresh();
      if (getPendingQueueCount() > 0) {
        try {
          const { processOfflineQueue } = await import("@/lib/services/sync");
          await processOfflineQueue();
          refresh();
        } catch {
          // Leave the queued records visible for manual retry.
        }
      }
      window.setTimeout(() => setRestored(false), 4000);
    }

    refresh();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("ashabhai-sync-queue", refresh);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("ashabhai-sync-queue", refresh);
    };
  }, []);

  return (
    <>
      <Badge variant={isOnline ? "success" : "warning"} className="gap-2 px-3 py-1.5">
        {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        {isOnline ? "Connected to central sync" : "Offline mode active"}
      </Badge>
      <Badge variant={pending ? "warning" : "outline"} className="gap-2 px-3 py-1.5">
        <WifiOff className="h-3.5 w-3.5" />
        {pending ? `${pending} queued for sync` : "Offline queue ready"}
      </Badge>
      {restored ? <Badge variant="primary" className="px-3 py-1.5">Network restored</Badge> : null}
    </>
  );
}
