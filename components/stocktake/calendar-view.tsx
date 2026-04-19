import Link from "next/link";
import { AppUser, Location, Site, StockTakePlan, Warehouse } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

export function CalendarView({
  plans,
  warehouses,
  users,
  sites,
  locations,
}: {
  plans: StockTakePlan[];
  warehouses: Warehouse[];
  users: AppUser[];
  sites: Site[];
  locations: Location[];
}) {
  const byDate = [...plans].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const warehouseName = (id: string) => warehouses.find((warehouse) => warehouse.id === id)?.name ?? "Unknown";
  const userName = (id: string) => users.find((user) => user.id === id)?.name ?? "Unassigned";
  void sites;
  void locations;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Stock Take Calendar"
        description="Calendar control board for warehouse schedule, site scope and location-loaded plans."
        actions={
          <Button asChild>
            <Link href="/stocktake/plans/new">Create new plan</Link>
          </Button>
        }
      />

      <SectionCard
        title="Upcoming planning schedule"
        description="Operational date board with scope size, count team separation and schedule windows."
      >
        <div className="grid gap-4">
          {byDate.map((plan) => (
            <div key={plan.id} className="rounded-[28px] border border-border/70 bg-muted/20 p-5">
              <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between">
                <div className="grid gap-2">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {plan.scheduledDate} | {plan.scheduleWindow}
                  </div>
                  <div className="text-xl font-semibold">{plan.name}</div>
                  <div className="text-sm leading-6 text-muted-foreground">
                    {warehouseName(plan.warehouseId)} | {plan.siteIds.length} sites | {plan.locationIds.length} locations
                  </div>
                  <div className="text-sm leading-6 text-muted-foreground">{plan.countMethod}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={plan.status} />
                  <Button variant="secondary" asChild>
                    <Link href={`/stocktake/plans/${plan.id}`}>Review plan</Link>
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 border-t border-border/70 pt-4 tablet:grid-cols-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">First count</div>
                  <div className="mt-1 font-semibold">{userName(plan.firstCountUserId)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Second count</div>
                  <div className="mt-1 font-semibold">{userName(plan.secondCountUserId)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sites</div>
                  <div className="mt-1 font-semibold">{plan.siteIds.length}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Locations</div>
                  <div className="mt-1 font-semibold">{plan.locationIds.length}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
