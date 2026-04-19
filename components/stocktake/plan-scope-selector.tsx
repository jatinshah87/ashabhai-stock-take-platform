"use client";

import { useMemo } from "react";
import { Location, Site, Warehouse } from "@/lib/types";
import {
  SearchableGroup,
  SearchableMultiSelect,
  SearchableOption,
} from "@/components/shared/searchable-multiselect";
import { SectionCard } from "@/components/shared/section-card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type PlanScopeSelectorProps = {
  warehouses: Warehouse[];
  sites: Site[];
  locations: Location[];
  selectedWarehouseId: string;
  selectedSiteIds: string[];
  selectedLocationIds: string[];
  onWarehouseChange: (warehouseId: string) => void;
  onSiteChange: (siteIds: string[]) => void;
  onLocationChange: (locationIds: string[]) => void;
};

export function PlanScopeSelector({
  warehouses,
  sites,
  locations,
  selectedWarehouseId,
  selectedSiteIds,
  selectedLocationIds,
  onWarehouseChange,
  onSiteChange,
  onLocationChange,
}: PlanScopeSelectorProps) {
  const warehouseSites = useMemo(
    () => sites.filter((site) => site.warehouseId === selectedWarehouseId),
    [sites, selectedWarehouseId],
  );

  const scopedLocations = useMemo(
    () => locations.filter((location) => selectedSiteIds.includes(location.siteId)),
    [locations, selectedSiteIds],
  );

  const siteOptions: SearchableOption[] = warehouseSites.map((site) => ({
    value: site.id,
    label: `${site.code} | ${site.name}`,
    description: `${site.type} | Manager ${site.manager}`,
    keywords: [site.code, site.type, site.manager],
  }));

  const locationGroups: SearchableGroup[] = warehouseSites
    .filter((site) => selectedSiteIds.includes(site.id))
    .map((site) => ({
      id: site.id,
      label: `${site.code} | ${site.name}`,
      description: `${locations.filter((location) => location.siteId === site.id).length} locations available`,
    }));

  const locationOptions: SearchableOption[] = scopedLocations.map((location) => ({
    value: location.id,
    label: `${location.code} | ${location.name}`,
    description: `${location.zone} | Aisle ${location.aisle} | Barcode ${location.barcode}`,
    groupId: location.siteId,
    keywords: [location.barcode, location.zone, location.aisle],
  }));

  function toggleLocationGroup(siteId: string) {
    const groupLocationIds = scopedLocations
      .filter((location) => location.siteId === siteId)
      .map((location) => location.id);
    const fullySelected = groupLocationIds.every((locationId) => selectedLocationIds.includes(locationId));

    onLocationChange(
      fullySelected
        ? selectedLocationIds.filter((locationId) => !groupLocationIds.includes(locationId))
        : Array.from(new Set([...selectedLocationIds, ...groupLocationIds])),
    );
  }

  function selectAllSites() {
    onSiteChange(warehouseSites.map((site) => site.id));
  }

  function clearSites() {
    onSiteChange([]);
    onLocationChange([]);
  }

  function selectAllLocations() {
    onLocationChange(scopedLocations.map((location) => location.id));
  }

  function clearLocations() {
    onLocationChange([]);
  }

  return (
    <SectionCard
      title="Plan scope"
      description="Define the warehouse, site and location footprint for the stock take plan."
    >
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="warehouse-selector">Warehouse</Label>
          <Select id="warehouse-selector" value={selectedWarehouseId} onChange={(e) => onWarehouseChange(e.target.value)}>
            <option value="">Select a warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} | {warehouse.name} | {warehouse.city}
              </option>
            ))}
          </Select>
        </div>

        <SearchableMultiSelect
          title="Sites"
          description="Choose one or more sites under the selected warehouse. This defines which site groups are available for location scoping."
          searchPlaceholder="Search sites by code, type, or manager"
          options={siteOptions}
          selectedValues={selectedSiteIds}
          onChange={(values) => {
            onSiteChange(values);
            onLocationChange(
              selectedLocationIds.filter((locationId) =>
                locations.some((location) => location.id === locationId && values.includes(location.siteId)),
              ),
            );
          }}
          emptyText="No sites are available for the selected warehouse."
          selectAllLabel="Select all sites"
          onSelectAll={selectAllSites}
          onClear={clearSites}
        />

        <SearchableMultiSelect
          title="Locations"
          description="Select the exact count locations. Locations are grouped by site so the plan footprint stays easy to audit."
          searchPlaceholder="Search locations by code, barcode, aisle, or zone"
          options={locationOptions}
          selectedValues={selectedLocationIds}
          onChange={onLocationChange}
          groups={locationGroups}
          emptyText="Select at least one site to view and choose locations."
          selectAllLabel="Select all visible locations"
          onSelectAll={selectAllLocations}
          onClear={clearLocations}
          onToggleGroup={toggleLocationGroup}
          isGroupFullySelected={(groupId) =>
            scopedLocations
              .filter((location) => location.siteId === groupId)
              .every((location) => selectedLocationIds.includes(location.id))
          }
        />
      </div>
    </SectionCard>
  );
}
