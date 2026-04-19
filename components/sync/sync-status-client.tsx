"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { getOfflineQueue } from "@/lib/offline/sync-queue";
import { getStoredAppRole } from "@/lib/services/session";
import { getSyncSummary, processOfflineQueue } from "@/lib/services/sync";
import { SyncSummary } from "@/lib/types";

export function SyncStatusClient() {
  const [summary, setSummary] = useState<(SyncSummary & { backendUnavailable?: boolean; localPending: number }) | null>(null);
  const [localQueueCount, setLocalQueueCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  async function refresh() {
    const data = await getSyncSummary();
    setSummary(data);
    setLocalQueueCount(getOfflineQueue().length);
  }

  useEffect(() => {
    setRole(getStoredAppRole());
    const params = new URLSearchParams(window.location.search);
    if (params.get("queuedSubmission") === "1") {
      setMessage("Submission was queued locally and will sync when connectivity is restored.");
    }

    refresh()
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load sync summary.");
      })
      .finally(() => setIsLoading(false));

    const handler = () => {
      refresh().catch(() => {});
      setLocalQueueCount(getOfflineQueue().length);
    };

    window.addEventListener("ashabhai-sync-queue", handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("ashabhai-sync-queue", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  async function handleRetry() {
    setIsRetrying(true);
    setError(null);
    setMessage(null);
    try {
      const result = await processOfflineQueue();
      await refresh();
      setMessage(
        `Retry complete: ${result.processed} processed, ${result.conflicts} conflicts, ${result.failed} failed.`,
      );
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Unable to retry sync.");
    } finally {
      setIsRetrying(false);
    }
  }

  if (isLoading || !summary) {
    return (
      <SectionCard title="Loading sync workspace">
        <div className="flex min-h-[260px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Sync Status"
        description="Track queued warehouse transactions, retry sync safely after connectivity returns, and monitor server-side processing health."
        actions={
          <Button onClick={handleRetry} disabled={isRetrying || summary.localPending === 0}>
            {isRetrying ? "Retrying..." : "Retry sync"}
            <RefreshCcw className="h-4 w-4" />
          </Button>
        }
      />

      {summary.backendUnavailable ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Backend sync services are unavailable. Local queue data is still visible below.
        </div>
      ) : null}
      {message ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">{error}</div> : null}

      <div className="grid gap-5 tablet:grid-cols-5">
        <SectionCard title="Queued records"><div className="text-4xl font-semibold">{summary.queued}</div></SectionCard>
        <SectionCard title="Processed"><div className="text-4xl font-semibold">{summary.processed}</div></SectionCard>
        <SectionCard title="Failed"><div className="text-4xl font-semibold text-rose-700">{summary.failed}</div></SectionCard>
        <SectionCard title="Pending"><div className="text-4xl font-semibold text-amber-700">{summary.pending}</div></SectionCard>
        <SectionCard title="Conflicts"><div className="text-4xl font-semibold">{summary.conflicts}</div></SectionCard>
      </div>

      <div className="grid gap-5 tablet:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Current device queue" description="Queued browser-side transactions waiting for server sync.">
          <div className="grid gap-3">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              {localQueueCount} locally tracked actions. Last successful sync: {summary.lastSyncAt ? new Date(summary.lastSyncAt).toLocaleString("en-IN") : "Not yet synced"}
            </div>
            {getOfflineQueue().length ? (
              getOfflineQueue().slice(0, 12).map((record) => (
                <div key={record.clientEntryId} className="rounded-2xl border border-border/70 bg-white p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{record.actionType} | {record.countType}</div>
                    <div className="text-muted-foreground">{record.status}</div>
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    {record.itemCode ?? "Item"} at {record.locationCode ?? "location"} | plan {record.planId}
                  </div>
                  {record.errorMessage ? <div className="mt-2 text-rose-700">{record.errorMessage}</div> : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                No queued transactions are stored on this device right now.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Conflict visibility" description="Auditors and admins can resolve queued conflicts without silent overwrites.">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              Unresolved conflicts: {summary.conflicts}
            </div>
            {role === "system-admin" || role === "auditor" ? (
              <Button variant="secondary" asChild>
                <Link href="/conflicts">Open conflict review</Link>
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground">
                Conflict review is available to audit and admin roles. Warehouse users can continue from queued sync status.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
