import { apiFetch } from "@/lib/api/http";
import {
  AnalyticsFilters,
  CompletionTrendsResponse,
  IntegrationHealthResponse,
  ManagementSummaryResponse,
  OperationalSummaryResponse,
  ProductivityResponse,
  SiteProgressRow,
  SyncHealthResponse,
  VarianceHotspotsResponse,
  WarehouseProgressRow,
} from "@/lib/types";

function buildAnalyticsParams(filters?: AnalyticsFilters) {
  return {
    warehouseId: filters?.warehouseId || undefined,
    siteId: filters?.siteId || undefined,
    planId: filters?.planId || undefined,
    userId: filters?.userId || undefined,
    locationId: filters?.locationId || undefined,
    itemId: filters?.itemId || undefined,
    severity: filters?.severity && filters.severity !== "all" ? filters.severity : undefined,
    status: filters?.status && filters.status !== "all" ? filters.status : undefined,
    dateFrom: filters?.dateFrom || undefined,
    dateTo: filters?.dateTo || undefined,
  };
}

export function getOperationalSummary(filters?: AnalyticsFilters) {
  return apiFetch<OperationalSummaryResponse>("/analytics/operational-summary", {
    searchParams: buildAnalyticsParams(filters),
  });
}

export function getManagementSummary(filters?: AnalyticsFilters) {
  return apiFetch<ManagementSummaryResponse>("/analytics/management-summary", {
    searchParams: buildAnalyticsParams(filters),
  });
}

export function getWarehouseProgress(filters?: AnalyticsFilters) {
  return apiFetch<{ rows: WarehouseProgressRow[] }>("/analytics/warehouse-progress", {
    searchParams: buildAnalyticsParams(filters),
  });
}

export function getSiteProgress(filters?: AnalyticsFilters) {
  return apiFetch<{ rows: SiteProgressRow[] }>("/analytics/site-progress", {
    searchParams: buildAnalyticsParams(filters),
  });
}

export function getVarianceHotspots(filters?: AnalyticsFilters) {
  return apiFetch<VarianceHotspotsResponse>("/analytics/variance-hotspots", {
    searchParams: buildAnalyticsParams(filters),
  });
}

export function getProductivity(filters?: AnalyticsFilters) {
  return apiFetch<ProductivityResponse>("/analytics/productivity", {
    searchParams: buildAnalyticsParams(filters),
  });
}

export function getSyncHealth(filters?: AnalyticsFilters) {
  return apiFetch<SyncHealthResponse>("/analytics/sync-health", {
    searchParams: buildAnalyticsParams(filters),
  });
}

export function getIntegrationHealth(filters?: AnalyticsFilters) {
  return apiFetch<IntegrationHealthResponse>("/analytics/integration-health", {
    searchParams: buildAnalyticsParams(filters),
  });
}

export function getCompletionTrends(filters?: AnalyticsFilters) {
  return apiFetch<CompletionTrendsResponse>("/analytics/completion-trends", {
    searchParams: buildAnalyticsParams(filters),
  });
}
