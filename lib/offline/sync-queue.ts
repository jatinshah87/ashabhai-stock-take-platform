import { getStoredUser } from "@/lib/services/session";
import { CountEntryRecord, CountTypeCode, OfflineQueueRecord, ValidatedItem, ValidatedLocation } from "@/lib/types";

const QUEUE_STORAGE_KEY = "ashabhai_sync_queue";
const DEVICE_STORAGE_KEY = "ashabhai_device_id";

function hasWindow() {
  return typeof window !== "undefined";
}

export function getDeviceId() {
  if (!hasWindow()) return "server-device";
  const existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existing) return existing;
  const deviceId = `device-${crypto.randomUUID()}`;
  window.localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
  return deviceId;
}

export function getOfflineQueue(): OfflineQueueRecord[] {
  if (!hasWindow()) return [];
  const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OfflineQueueRecord[];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(records: OfflineQueueRecord[]) {
  if (!hasWindow()) return;
  window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("ashabhai-sync-queue"));
}

export function enqueueOfflineRecord(
  record: Omit<OfflineQueueRecord, "deviceId" | "clientTimestamp" | "status">,
) {
  const queued: OfflineQueueRecord = {
    ...record,
    deviceId: getDeviceId(),
    clientTimestamp: new Date().toISOString(),
    status: "pending",
  };
  saveOfflineQueue([queued, ...getOfflineQueue()]);
  return queued;
}

export function updateOfflineQueueRecord(
  clientEntryId: string,
  updater: (record: OfflineQueueRecord) => OfflineQueueRecord,
) {
  const next = getOfflineQueue().map((record) =>
    record.clientEntryId === clientEntryId ? updater(record) : record,
  );
  saveOfflineQueue(next);
}

export function replaceOfflineQueue(records: OfflineQueueRecord[]) {
  saveOfflineQueue(records);
}

export function clearSyncedOfflineQueue() {
  saveOfflineQueue(getOfflineQueue().filter((record) => record.status !== "synced"));
}

export function getPendingQueueCount() {
  return getOfflineQueue().filter((record) => record.status === "pending").length;
}

export function buildOfflineEntry(
  queued: OfflineQueueRecord,
  currentUserName?: string,
): CountEntryRecord | null {
  if (queued.actionType !== "CREATE" && queued.actionType !== "UPDATE") {
    return null;
  }

  if (!queued.locationId || !queued.itemId || !queued.itemUomId) {
    return null;
  }

  return {
    id: `local-${queued.clientEntryId}`,
    countType: queued.countType,
    locationId: queued.locationId,
    locationCode: queued.locationCode ?? "Pending location",
    locationName: queued.locationName ?? "Offline queued location",
    itemId: queued.itemId,
    itemCode: queued.itemCode ?? "Pending item",
    itemDescription: queued.itemDescription ?? "Offline queued item",
    itemUomId: queued.itemUomId,
    uomCode: queued.uomCode ?? "UOM",
    countedQty: queued.countedQuantity ?? 0,
    countedAt: queued.clientTimestamp,
    countedByUserId: getStoredUser()?.id ?? "offline-user",
    countedByName: currentUserName ?? getStoredUser()?.name ?? "Offline queue",
    syncStatus: "local-pending",
    clientEntryId: queued.clientEntryId,
  };
}

export function mergeOfflineEntries(
  planId: string,
  countType: CountTypeCode,
  serverEntries: CountEntryRecord[],
) {
  const queue = getOfflineQueue().filter(
    (record) =>
      record.planId === planId &&
      record.countType === countType &&
      (record.status === "pending" || record.status === "conflict" || record.status === "failed"),
  );

  let entries = [...serverEntries];

  for (const queued of queue) {
    if (queued.actionType === "DELETE") {
      entries = entries.filter(
        (entry) =>
          !(
            entry.locationId === queued.locationId &&
            entry.itemId === queued.itemId
          ),
      );
      continue;
    }

    const offlineEntry = buildOfflineEntry(queued);
    if (!offlineEntry) continue;

    const existingIndex = entries.findIndex(
      (entry) =>
        entry.locationId === offlineEntry.locationId &&
        entry.itemId === offlineEntry.itemId,
    );

    if (existingIndex >= 0) {
      entries[existingIndex] = offlineEntry;
    } else {
      entries.unshift(offlineEntry);
    }
  }

  return entries;
}

export function createQueuedCountRecord(params: {
  planId: string;
  countType: CountTypeCode;
  location: ValidatedLocation;
  item: ValidatedItem;
  itemUomId: string;
  countedQuantity: number;
}) {
  const selectedUom = params.item.uoms.find((uom) => uom.id === params.itemUomId);

  return enqueueOfflineRecord({
    clientEntryId: crypto.randomUUID(),
    planId: params.planId,
    countType: params.countType,
    actionType: "CREATE",
    locationId: params.location.id,
    locationCode: params.location.code,
    locationName: params.location.name,
    itemId: params.item.id,
    itemCode: params.item.code,
    itemDescription: params.item.description,
    itemUomId: params.itemUomId,
    uomCode: selectedUom?.uomCode ?? params.item.scannedUomCode ?? undefined,
    countedQuantity: params.countedQuantity,
  });
}

export function createQueuedDeleteRecord(params: {
  planId: string;
  countType: CountTypeCode;
  entry: CountEntryRecord;
}) {
  if (params.entry.syncStatus === "local-pending" && params.entry.clientEntryId) {
    saveOfflineQueue(
      getOfflineQueue().filter((record) => record.clientEntryId !== params.entry.clientEntryId),
    );
    return null;
  }

  return enqueueOfflineRecord({
    clientEntryId: params.entry.clientEntryId ?? crypto.randomUUID(),
    planId: params.planId,
    countType: params.countType,
    actionType: "DELETE",
    locationId: params.entry.locationId,
    locationCode: params.entry.locationCode,
    locationName: params.entry.locationName,
    itemId: params.entry.itemId,
    itemCode: params.entry.itemCode,
    itemDescription: params.entry.itemDescription,
    itemUomId: params.entry.itemUomId,
    uomCode: params.entry.uomCode,
  });
}

export function createQueuedSubmitRecord(params: {
  planId: string;
  countType: CountTypeCode;
  notes?: string;
}) {
  return enqueueOfflineRecord({
    clientEntryId: `submit-${crypto.randomUUID()}`,
    planId: params.planId,
    countType: params.countType,
    actionType: "SUBMIT",
    notes: params.notes,
  });
}
