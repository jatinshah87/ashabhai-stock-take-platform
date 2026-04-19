import { apiFetch } from "@/lib/api/http";
import { InventoryItem, StockSnapshotRecord, ValidatedItem } from "@/lib/types";

export async function listInventoryItems(search?: string) {
  return apiFetch<InventoryItem[]>("/inventory/items", {
    searchParams: { search },
  });
}

export async function getItemByBarcode(barcode: string) {
  return apiFetch<ValidatedItem>(`/inventory/barcodes/${encodeURIComponent(barcode)}`);
}

export async function listStockSnapshots(params?: {
  planId?: string;
  warehouseId?: string;
  siteId?: string;
  locationId?: string;
}) {
  return apiFetch<StockSnapshotRecord[]>("/inventory/stock-snapshots", {
    searchParams: params,
  });
}
