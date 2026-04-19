import { apiFetch, isBackendUnavailable } from "@/lib/api/http";
import {
  createQueuedCountRecord,
  createQueuedDeleteRecord,
  createQueuedSubmitRecord,
  mergeOfflineEntries,
} from "@/lib/offline/sync-queue";
import { getStoredUser } from "@/lib/services/session";
import {
  AssignedExecutionPlan,
  CountEntryRecord,
  CountReviewData,
  CountTypeCode,
  ExecutionPlanDetail,
  SaveCountEntryPayload,
  ValidatedItem,
  ValidatedLocation,
} from "@/lib/types";

const ASSIGNED_PLANS_CACHE_KEY = "ashabhai_assigned_plans_cache";
const EXECUTION_PLAN_CACHE_PREFIX = "ashabhai_execution_plan_";

function cacheExecutionPlan(planId: string, plan: ExecutionPlanDetail) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${EXECUTION_PLAN_CACHE_PREFIX}${planId}`, JSON.stringify(plan));
}

function readExecutionPlanCache(planId: string) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${EXECUTION_PLAN_CACHE_PREFIX}${planId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExecutionPlanDetail;
  } catch {
    return null;
  }
}

function cacheAssignedPlans(plans: AssignedExecutionPlan[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ASSIGNED_PLANS_CACHE_KEY, JSON.stringify(plans));
}

function readAssignedPlansCache() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ASSIGNED_PLANS_CACHE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AssignedExecutionPlan[];
  } catch {
    return [];
  }
}

export async function getMyAssignedPlans() {
  try {
    const plans = await apiFetch<AssignedExecutionPlan[]>("/count-execution/my-plans");
    cacheAssignedPlans(plans);
    return plans;
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return readAssignedPlansCache();
  }
}

export async function getExecutionPlan(planId: string, countType?: CountTypeCode) {
  try {
    const plan = await apiFetch<ExecutionPlanDetail>(`/count-execution/plans/${planId}`, {
      searchParams: {
        countType,
      },
    });
    cacheExecutionPlan(planId, plan);
    return plan;
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    const cached = readExecutionPlanCache(planId);
    if (!cached) throw error;
    return cached;
  }
}

export async function validateLocationBarcode(
  planId: string,
  payload: { countType: CountTypeCode; barcode: string },
) {
  return apiFetch<ValidatedLocation>(`/count-execution/plans/${planId}/validate-location`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function validateItemBarcode(
  planId: string,
  payload: { countType: CountTypeCode; barcode: string; locationId?: string },
) {
  return apiFetch<ValidatedItem>(`/count-execution/plans/${planId}/validate-item`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listCountEntries(planId: string, countType: CountTypeCode) {
  try {
    const serverEntries = await apiFetch<CountEntryRecord[]>(`/count-execution/plans/${planId}/entries`, {
      searchParams: { countType },
    });
    return mergeOfflineEntries(planId, countType, serverEntries);
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    return mergeOfflineEntries(planId, countType, []);
  }
}

export async function saveCountEntry(
  planId: string,
  payload: SaveCountEntryPayload & {
    locationCode?: string;
    locationName?: string;
    itemCode?: string;
    itemDescription?: string;
    uomCode?: string;
    scannedItem?: ValidatedItem;
    validatedLocation?: ValidatedLocation;
  },
) {
  try {
    return await apiFetch<CountEntryRecord>(`/count-execution/plans/${planId}/entries`, {
      method: "POST",
      body: JSON.stringify({
        countType: payload.countType,
        locationId: payload.locationId,
        itemId: payload.itemId,
        itemUomId: payload.itemUomId,
        countedQty: payload.countedQty,
      }),
    });
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    if (!payload.scannedItem || !payload.validatedLocation) {
      throw error;
    }

    const queued = createQueuedCountRecord({
      planId,
      countType: payload.countType,
      location: payload.validatedLocation,
      item: payload.scannedItem,
      itemUomId: payload.itemUomId,
      countedQuantity: payload.countedQty,
    });

    const user = getStoredUser();
    return {
      id: `local-${queued.clientEntryId}`,
      countType: payload.countType,
      locationId: payload.locationId,
      locationCode: payload.locationCode ?? payload.validatedLocation.code,
      locationName: payload.locationName ?? payload.validatedLocation.name,
      itemId: payload.itemId,
      itemCode: payload.itemCode ?? payload.scannedItem.code,
      itemDescription: payload.itemDescription ?? payload.scannedItem.description,
      itemUomId: payload.itemUomId,
      uomCode:
        payload.uomCode ??
        payload.scannedItem.uoms.find((uom) => uom.id === payload.itemUomId)?.uomCode ??
        "UOM",
      countedQty: payload.countedQty,
      countedAt: queued.clientTimestamp,
      countedByUserId: user?.id ?? "offline-user",
      countedByName: user?.name ?? "Offline queue",
      syncStatus: "local-pending",
      clientEntryId: queued.clientEntryId,
    };
  }
}

export async function updateCountEntry(
  planId: string,
  entryId: string,
  payload: { countType: CountTypeCode; itemUomId?: string; countedQty?: number },
) {
  return apiFetch<CountEntryRecord>(`/count-execution/plans/${planId}/entries/${entryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCountEntry(
  planId: string,
  entryId: string,
  countType: CountTypeCode,
  entry?: CountEntryRecord,
) {
  try {
    return await apiFetch<{ success: true; pendingSync?: boolean }>(`/count-execution/plans/${planId}/entries/${entryId}`, {
      method: "DELETE",
      searchParams: { countType },
    });
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    if (!entry) {
      throw error;
    }

    createQueuedDeleteRecord({
      planId,
      countType,
      entry,
    });

    return { success: true, pendingSync: true };
  }
}

export async function getCountReview(planId: string, countType: CountTypeCode) {
  function buildReviewFromLines(lines: CountEntryRecord[]): CountReviewData {
    const grouped = new Map<string, CountReviewData["groups"][number]>();

    for (const line of lines) {
      const current = grouped.get(line.locationId) ?? {
        locationId: line.locationId,
        locationCode: line.locationCode,
        locationName: line.locationName,
        entryCount: 0,
        lines: [],
      };
      current.entryCount += 1;
      current.lines.push(line);
      grouped.set(line.locationId, current);
    }

    return {
      summary: {
        planId,
        countType,
        entryCount: lines.length,
        locationCount: grouped.size,
        readOnly: false,
        submittedAt: null,
      },
      groups: Array.from(grouped.values()),
    };
  }

  try {
    const serverReview = await apiFetch<CountReviewData>(`/count-execution/plans/${planId}/review`, {
      searchParams: { countType },
    });
    const serverLines = serverReview.groups.flatMap((group) => group.lines);
    const mergedLines = mergeOfflineEntries(planId, countType, serverLines);

    return {
      summary: {
        ...serverReview.summary,
        entryCount: mergedLines.length,
        locationCount: new Set(mergedLines.map((line) => line.locationId)).size,
      },
      groups: buildReviewFromLines(mergedLines).groups,
    };
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    return buildReviewFromLines(mergeOfflineEntries(planId, countType, []));
  }
}

export async function submitCount(planId: string, payload: { countType: CountTypeCode; notes?: string }) {
  try {
    return await apiFetch<{
      success: true;
      planId: string;
      countType: CountTypeCode;
      submittedAt: string | null;
      locked: boolean;
      status: string;
      pendingSync?: boolean;
    }>(`/count-execution/plans/${planId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    const queued = createQueuedSubmitRecord({
      planId,
      countType: payload.countType,
      notes: payload.notes,
    });

    return {
      success: true,
      planId,
      countType: payload.countType,
      submittedAt: queued.clientTimestamp,
      locked: false,
      status: "In Progress",
      pendingSync: true,
    };
  }
}
