"use client";

import { AnalyticsFilters, AppUser, Site, StockTakePlan, Warehouse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SectionCard } from "@/components/shared/section-card";

export function AnalyticsFiltersPanel({
  filters,
  warehouses,
  sites,
  plans,
  users,
  onChange,
  onReset,
}: {
  filters: AnalyticsFilters;
  warehouses: Warehouse[];
  sites: Site[];
  plans: StockTakePlan[];
  users: AppUser[];
  onChange: (filters: AnalyticsFilters) => void;
  onReset: () => void;
}) {
  const filteredSites = filters.warehouseId
    ? sites.filter((site) => site.warehouseId === filters.warehouseId)
    : sites;
  const filteredPlans = filters.warehouseId
    ? plans.filter((plan) => plan.warehouseId === filters.warehouseId)
    : plans;

  return (
    <SectionCard
      title="Analytics filters"
      description="Refine dashboard output by warehouse, site, plan status, date window, or assigned user."
      actions={
        <Button variant="secondary" onClick={onReset}>
          Reset
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="grid gap-2">
          <Label htmlFor="warehouseId">Warehouse</Label>
          <Select
            id="warehouseId"
            value={filters.warehouseId ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                warehouseId: event.target.value || undefined,
                siteId: undefined,
                planId: undefined,
              })
            }
          >
            <option value="">All warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} · {warehouse.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="siteId">Site</Label>
          <Select
            id="siteId"
            value={filters.siteId ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                siteId: event.target.value || undefined,
              })
            }
          >
            <option value="">All sites</option>
            {filteredSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.code} · {site.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="planId">Plan</Label>
          <Select
            id="planId"
            value={filters.planId ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                planId: event.target.value || undefined,
              })
            }
          >
            <option value="">All plans</option>
            {filteredPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.code} · {plan.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status">Plan status</Label>
          <Select
            id="status"
            value={filters.status ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                status: (event.target.value as AnalyticsFilters["status"]) || undefined,
              })
            }
          >
            <option value="">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="userId">User</Label>
          <Select
            id="userId"
            value={filters.userId ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                userId: event.target.value || undefined,
              })
            }
          >
            <option value="">All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} · {user.role}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="severity">Variance severity</Label>
          <Select
            id="severity"
            value={filters.severity ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                severity: (event.target.value as AnalyticsFilters["severity"]) || undefined,
              })
            }
          >
            <option value="">All severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="matched">Matched</option>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dateFrom">Date from</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                dateFrom: event.target.value || undefined,
              })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dateTo">Date to</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                dateTo: event.target.value || undefined,
              })
            }
          />
        </div>
      </div>
    </SectionCard>
  );
}
