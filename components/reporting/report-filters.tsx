"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { ReportFilters, VarianceSeverity, Warehouse, Site, Location, StockTakePlan } from "@/lib/types";

export function ReportFiltersPanel({
  filters,
  onChange,
  warehouses,
  sites,
  locations,
  plans,
}: {
  filters: ReportFilters;
  onChange: (next: ReportFilters) => void;
  warehouses: Warehouse[];
  sites: Site[];
  locations: Location[];
  plans: StockTakePlan[];
}) {
  return (
    <FilterToolbar>
      <Select
        value={filters.planId ?? ""}
        onChange={(event) => onChange({ ...filters, planId: event.target.value || undefined })}
      >
        <option value="">All plans</option>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.code}
          </option>
        ))}
      </Select>
      <Select
        value={filters.warehouseId ?? ""}
        onChange={(event) => onChange({ ...filters, warehouseId: event.target.value || undefined })}
      >
        <option value="">All warehouses</option>
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.name}
          </option>
        ))}
      </Select>
      <Select
        value={filters.siteId ?? ""}
        onChange={(event) => onChange({ ...filters, siteId: event.target.value || undefined })}
      >
        <option value="">All sites</option>
        {sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </Select>
      <Select
        value={filters.locationId ?? ""}
        onChange={(event) => onChange({ ...filters, locationId: event.target.value || undefined })}
      >
        <option value="">All locations</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.code}
          </option>
        ))}
      </Select>
      <Select
        value={filters.severity ?? "all"}
        onChange={(event) =>
          onChange({
            ...filters,
            severity:
              event.target.value === "all"
                ? "all"
                : (event.target.value as VarianceSeverity),
          })
        }
      >
        <option value="all">All severity</option>
        <option value="matched">Matched</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </Select>
      <Input
        placeholder="Item code or description"
        value={filters.itemId ?? ""}
        onChange={(event) => onChange({ ...filters, itemId: event.target.value || undefined })}
      />
    </FilterToolbar>
  );
}
