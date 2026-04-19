import { apiFetch, isBackendUnavailable } from "@/lib/api/http";
import {
  clearSyncedOfflineQueue,
  getOfflineQueue,
  getPendingQueueCount,
  replaceOfflineQueue,
} from "@/lib/offline/sync-queue";
import {
  OfflineSyncQueueStatus,
  SyncConflictDetail,
  SyncConflictListItem,
  SyncQueueRecord,
  SyncSummary,
} from "@/lib/types";

export async function getSyncSummary(): Promise<SyncSummary & { backendUnavailable?: boolean; localPending: number }> {
  try {
    const summary = await apiFetch<SyncSummary>("/sync/summary");
    return {
      ...summary,
      localPending: getPendingQueueCount(),
    };
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return {
      queued: getPendingQueueCount(),
      processed: 0,
      failed: 0,
      pending: getPendingQueueCount(),
      conflicts: 0,
      lastSyncAt: null,
      localPending: getPendingQueueCount(),
      backendUnavailable: true,
    };
  }
}

export async function getSyncQueue() {
  return apiFetch<SyncQueueRecord[]>("/sync/queue");
}

export async function getSyncConflicts() {
  return apiFetch<SyncConflictListItem[]>("/sync/conflicts");
}

export async function getSyncConflict(id: string) {
  return apiFetch<SyncConflictDetail>(`/sync/conflicts/${id}`);
}

export async function resolveSyncConflict(
  id: string,
  payload: { resolutionAction: "KEEP_LOCAL" | "KEEP_SERVER" | "MARK_REVIEW" | "RETRY_REPLAY"; notes?: string },
) {
  return apiFetch<{
    success: true;
    conflictId: string;
    status: string;
    resolutionAction: string | null;
    resolvedAt: string | null;
  }>(`/sync/conflicts/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function processOfflineQueue() {
  const pending = getOfflineQueue().filter((record) => record.status === "pending");
  if (!pending.length) {
    return { processed: 0, conflicts: 0, failed: 0 };
  }

  const response = await apiFetch<{
    deviceId: string;
    processedAt: string;
    results: Array<{
      queueId: string;
      clientEntryId: string;
      actionType: string;
      syncStatus: "PENDING" | "PROCESSED" | "FAILED" | "CONFLICT" | "RESOLVED" | "SKIPPED";
      message: string;
      conflictId?: string | null;
    }>;
  }>("/sync/batch", {
    method: "POST",
    body: JSON.stringify({
      deviceId: pending[0]?.deviceId,
      records: pending.map((record) => ({
        planId: record.planId,
        countType: record.countType,
        locationId: record.locationId,
        itemId: record.itemId,
        itemUomId: record.itemUomId,
        uomCode: record.uomCode,
        countedQuantity: record.countedQuantity,
        actionType: record.actionType,
        clientEntryId: record.clientEntryId,
        clientTimestamp: record.clientTimestamp,
        notes: record.notes,
        payloadSnapshot: record,
      })),
    }),
  });

  const existing = getOfflineQueue();
  const updated = existing.map((record) => {
    const result = response.results.find((item) => item.clientEntryId === record.clientEntryId);
    if (!result) return record;

    return {
      ...record,
      status:
        result.syncStatus === "PROCESSED" || result.syncStatus === "SKIPPED" || result.syncStatus === "RESOLVED"
          ? "synced"
          : result.syncStatus === "CONFLICT"
            ? "conflict"
            : "failed" as OfflineSyncQueueStatus,
      errorMessage: result.message,
    };
  });

  replaceOfflineQueue(updated);
  clearSyncedOfflineQueue();

  return {
    processed: response.results.filter((item) => item.syncStatus === "PROCESSED" || item.syncStatus === "SKIPPED").length,
    conflicts: response.results.filter((item) => item.syncStatus === "CONFLICT").length,
    failed: response.results.filter((item) => item.syncStatus === "FAILED").length,
  };
}
