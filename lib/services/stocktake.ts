import { ApiError, apiFetch, isBackendUnavailable } from "@/lib/api/http";
import { businessUsers, locations as mockLocations, sites as mockSites, stockTakePlans, warehouses as mockWarehouses } from "@/lib/mock-data";
import {
  AppUser,
  CreateStockTakePlanPayload,
  Location,
  PlanStatus,
  Site,
  StockTakePlan,
  UpdateStockTakePlanPayload,
  Warehouse,
} from "@/lib/types";

export type PlanFilters = {
  search?: string;
  status?: PlanStatus | "all";
  warehouseId?: string | "all";
};

export async function getPlans(filters?: PlanFilters): Promise<StockTakePlan[]> {
  try {
    return await apiFetch<StockTakePlan[]>("/stock-take-plans", {
      searchParams: {
        search: filters?.search?.trim() || undefined,
        status: filters?.status && filters.status !== "all" ? filters.status : undefined,
        warehouseId:
          filters?.warehouseId && filters.warehouseId !== "all" ? filters.warehouseId : undefined,
      },
    });
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    const term = filters?.search?.trim().toLowerCase();
    return stockTakePlans.filter((plan) => {
      const matchesSearch =
        !term ||
        plan.name.toLowerCase().includes(term) ||
        plan.code.toLowerCase().includes(term) ||
        plan.description.toLowerCase().includes(term);
      const matchesStatus = !filters?.status || filters.status === "all" || plan.status === filters.status;
      const matchesWarehouse =
        !filters?.warehouseId || filters.warehouseId === "all" || plan.warehouseId === filters.warehouseId;
      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }
}

export async function getPlanById(id: string): Promise<StockTakePlan | null> {
  try {
    return await apiFetch<StockTakePlan>(`/stock-take-plans/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getPlanningReferenceData(): Promise<{
  warehouses: Warehouse[];
  sites: Site[];
  locations: Location[];
  users: AppUser[];
}> {
  try {
    const [hierarchy, users] = await Promise.all([
      apiFetch<
        Array<
          Warehouse & {
            sites: Array<
              Site & {
                locations: Location[];
              }
            >;
          }
        >
      >("/master-data/hierarchy"),
      apiFetch<AppUser[]>("/users", {
        searchParams: {
          status: "active",
        },
      }),
    ]);

    return {
      warehouses: hierarchy.map(({ sites: _sites, ...warehouse }) => warehouse),
      sites: hierarchy.flatMap((warehouse) =>
        warehouse.sites.map(({ locations: _locations, ...site }) => site),
      ),
      locations: hierarchy.flatMap((warehouse) =>
        warehouse.sites.flatMap((site) => site.locations),
      ),
      users,
    };
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return {
      warehouses: mockWarehouses,
      sites: mockSites,
      locations: mockLocations,
      users: businessUsers.filter((user) => user.status === "active"),
    };
  }
}

export async function getLocationsBySiteIds(siteIds: string[]): Promise<Location[]> {
  try {
    const hierarchy = await apiFetch<
      Array<
        Warehouse & {
          sites: Array<
            Site & {
              locations: Location[];
            }
          >;
        }
      >
    >("/master-data/hierarchy");

    return hierarchy.flatMap((warehouse) =>
      warehouse.sites
        .filter((site) => siteIds.includes(site.id))
        .flatMap((site) => site.locations),
    );
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return mockLocations.filter((location) => siteIds.includes(location.siteId));
  }
}

export async function createPlan(payload: CreateStockTakePlanPayload): Promise<StockTakePlan> {
  return apiFetch<StockTakePlan>("/stock-take-plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePlan(
  id: string,
  payload: UpdateStockTakePlanPayload,
): Promise<StockTakePlan> {
  return apiFetch<StockTakePlan>(`/stock-take-plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
