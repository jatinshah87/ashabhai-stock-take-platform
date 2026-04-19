"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarRange, Plus, Search } from "lucide-react";
import { AppUser, Location, Site, StockTakePlan, Warehouse } from "@/lib/types";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PlanListClientProps = {
  plans: StockTakePlan[];
  warehouses: Warehouse[];
  sites: Site[];
  locations: Location[];
  users: AppUser[];
};

export function PlanListClient({ plans, warehouses, sites, locations, users }: PlanListClientProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [warehouseId, setWarehouseId] = useState("all");

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase();
    return plans.filter((plan) => {
      const matchesSearch =
        !term ||
        plan.name.toLowerCase().includes(term) ||
        plan.code.toLowerCase().includes(term) ||
        plan.description.toLowerCase().includes(term);
      const matchesStatus = status === "all" || plan.status === status;
      const matchesWarehouse = warehouseId === "all" || plan.warehouseId === warehouseId;
      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }, [plans, search, status, warehouseId]);

  const warehouseName = (id: string) => warehouses.find((warehouse) => warehouse.id === id)?.name ?? "Unknown";
  const userName = (id: string) => users.find((user) => user.id === id)?.name ?? "Unassigned";

  const dashboardKpis = [
    ["Warehouses under plan", String(new Set(plans.map((plan) => plan.warehouseId)).size)],
    ["Sites scheduled", String(new Set(plans.flatMap((plan) => plan.siteIds)).size)],
    ["Locations scheduled", String(new Set(plans.flatMap((plan) => plan.locationIds)).size)],
    ["First counts pending", String(plans.filter((plan) => plan.status !== "Completed").length)],
    ["Second counts pending", String(plans.filter((plan) => plan.status === "In Progress" || plan.status === "Scheduled").length)],
    ["Locked plans", String(plans.filter((plan) => plan.locked).length)],
    ["High variance flags", String(plans.filter((plan) => plan.highVariancePlaceholder).length)],
  ];

  void locations;
  void sites;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Stock Take Plans"
        description="Audit-control planning board with warehouse, site and location scope, assignments and schedule visibility."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/stocktake/calendar">
                <CalendarRange className="h-4 w-4" />
                Calendar
              </Link>
            </Button>
            <Button asChild>
              <Link href="/stocktake/plans/new">
                <Plus className="h-4 w-4" />
                New plan
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 tablet:grid-cols-2 xl:grid-cols-7">
        {dashboardKpis.map(([label, value]) => (
          <div key={label} className="surface-panel grid gap-2 p-5">
            <div className="text-sm font-semibold text-muted-foreground">{label}</div>
            <div className="metric-kpi text-3xl">{value}</div>
          </div>
        ))}
      </div>

      <FilterToolbar>
        <div className="relative tablet:col-span-2 xl:col-span-3">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search plan name, code, or description" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          <option value="all">All warehouses</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </Select>
      </FilterToolbar>

      {filteredPlans.length === 0 ? (
        <EmptyState
          title="No plans match the current view"
          description="Adjust your filters or create a new stock take plan with warehouse, site and location scope."
          action={
            <Button asChild>
              <Link href="/stocktake/plans/new">Create plan</Link>
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Planning board"
          description="Operational list with warehouse, site, location, count team, schedule and control flags."
        >
          <div className="overflow-hidden rounded-[24px] border border-border/80 bg-white">
            <div className="max-w-full overflow-auto">
              <Table>
                <TableHeader className="bg-muted/70">
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Sites</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>First count</TableHead>
                    <TableHead>Second count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Quick actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="grid gap-1">
                          <div className="font-semibold">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">{plan.code}</div>
                          <div className="text-sm text-muted-foreground">{plan.countMethod}</div>
                        </div>
                      </TableCell>
                      <TableCell>{warehouseName(plan.warehouseId)}</TableCell>
                      <TableCell>{plan.siteIds.length}</TableCell>
                      <TableCell>{plan.locationIds.length}</TableCell>
                      <TableCell>{userName(plan.firstCountUserId)}</TableCell>
                      <TableCell>{userName(plan.secondCountUserId)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <StatusBadge status={plan.status} />
                          {plan.locked ? <span className="text-xs font-medium text-danger">Locked</span> : null}
                          {plan.highVariancePlaceholder ? (
                            <span className="text-xs font-medium text-warning">Variance watch</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-1 text-sm">
                          <span>{plan.scheduledDate}</span>
                          <span className="text-muted-foreground">{plan.scheduleWindow}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" asChild>
                            <Link href={`/stocktake/plans/${plan.id}`}>Open</Link>
                          </Button>
                          <Button variant="ghost" asChild>
                            <Link href="/stocktake/calendar">Calendar</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
