import { apiFetch } from "@/lib/api/http";
import {
  AnomalyDetail,
  AnomalyFilters,
  AnomalyListItem,
  AnomalySummaryResponse,
} from "@/lib/types";

function buildParams(filters?: AnomalyFilters) {
  return {
    warehouseId: filters?.warehouseId || undefined,
    siteId: filters?.siteId || undefined,
    planId: filters?.planId || undefined,
    locationId: filters?.locationId || undefined,
    itemId: filters?.itemId || undefined,
    userId: filters?.userId || undefined,
    severity: filters?.severity && filters.severity !== "all" ? filters.severity : undefined,
    status: filters?.status && filters.status !== "all" ? filters.status : undefined,
    anomalyType:
      filters?.anomalyType && filters.anomalyType !== "all" ? filters.anomalyType : undefined,
    dateFrom: filters?.dateFrom || undefined,
    dateTo: filters?.dateTo || undefined,
  };
}

export function listAnomalies(filters?: AnomalyFilters) {
  return apiFetch<AnomalyListItem[]>("/anomalies", {
    searchParams: buildParams(filters),
  });
}

export function getAnomaly(id: string) {
  return apiFetch<AnomalyDetail>(`/anomalies/${id}`);
}

export function getAnomalySummary(filters?: AnomalyFilters) {
  return apiFetch<AnomalySummaryResponse>("/anomalies/summary", {
    searchParams: buildParams(filters),
  });
}

export function runAnomalyDetection(payload?: {
  warehouseId?: string;
  siteId?: string;
  planId?: string;
}) {
  return apiFetch<{ created: number; updated: number; closed: number; totalDetected: number }>(
    "/anomalies/run",
    {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    },
  );
}

export function reviewAnomaly(
  id: string,
  payload: { status: "OPEN" | "REVIEWED" | "CLOSED"; notes?: string },
) {
  return apiFetch<{ success: true; id: string; status: string; reviewedAt: string | null }>(
    `/anomalies/${id}/review`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
