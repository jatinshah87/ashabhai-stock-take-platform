import { apiDownload, apiFetch } from "@/lib/api/http";
import { ReportFilters, ReportResponse, ReportType } from "@/lib/types";

function buildFilterParams(filters?: ReportFilters) {
  return {
    planId: filters?.planId || undefined,
    warehouseId: filters?.warehouseId || undefined,
    siteId: filters?.siteId || undefined,
    locationId: filters?.locationId || undefined,
    itemId: filters?.itemId || undefined,
    severity: filters?.severity && filters.severity !== "all" ? filters.severity : undefined,
  };
}

export async function getReport(type: ReportType, filters?: ReportFilters) {
  return apiFetch<ReportResponse>(`/reports/${type}`, {
    searchParams: buildFilterParams(filters),
  });
}

export async function downloadReport(type: ReportType, filters?: ReportFilters) {
  const downloaded = await apiDownload(`/reports/${type}/export`, {
    searchParams: buildFilterParams(filters),
  });

  if (typeof window !== "undefined") {
    const url = window.URL.createObjectURL(downloaded.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloaded.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }
}
