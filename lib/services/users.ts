import { ApiError, apiFetch, isBackendUnavailable } from "@/lib/api/http";
import { businessUsers, sites as mockSites, warehouses as mockWarehouses } from "@/lib/mock-data";
import {
  AppUser,
  BusinessUserRole,
  CreateUserPayload,
  EntityStatus,
  Site,
  UpdateUserPayload,
  Warehouse,
} from "@/lib/types";

export type UserFilters = {
  search?: string;
  role?: BusinessUserRole | "all";
  warehouseId?: string | "all";
  siteId?: string | "all";
  status?: EntityStatus | "all";
};

export async function getUsers(filters?: UserFilters): Promise<AppUser[]> {
  try {
    return await apiFetch<AppUser[]>("/users", {
      searchParams: {
        search: filters?.search?.trim() || undefined,
        role: filters?.role && filters.role !== "all" ? filters.role : undefined,
        warehouseId:
          filters?.warehouseId && filters.warehouseId !== "all" ? filters.warehouseId : undefined,
        siteId: filters?.siteId && filters.siteId !== "all" ? filters.siteId : undefined,
        status: filters?.status && filters.status !== "all" ? filters.status : undefined,
      },
    });
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;

    const search = filters?.search?.trim().toLowerCase();
    return businessUsers.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.employeeCode.toLowerCase().includes(search);
      const matchesRole = !filters?.role || filters.role === "all" || user.role === filters.role;
      const matchesWarehouse =
        !filters?.warehouseId || filters.warehouseId === "all" || user.warehouseId === filters.warehouseId;
      const matchesSite = !filters?.siteId || filters.siteId === "all" || user.siteIds.includes(filters.siteId);
      const matchesStatus = !filters?.status || filters.status === "all" || user.status === filters.status;
      return matchesSearch && matchesRole && matchesWarehouse && matchesSite && matchesStatus;
    });
  }
}

export async function getUserById(id: string): Promise<AppUser | null> {
  try {
    return await apiFetch<AppUser>(`/users/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getWarehouses(): Promise<Warehouse[]> {
  try {
    return await apiFetch<Warehouse[]>("/master-data/warehouses");
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return mockWarehouses;
  }
}

export async function getSites(warehouseId?: string): Promise<Site[]> {
  try {
    if (warehouseId) {
      return await apiFetch<Site[]>(`/master-data/warehouses/${warehouseId}/sites`);
    }

    const hierarchy = await apiFetch<
      Array<
        Warehouse & {
          sites: Site[];
        }
      >
    >("/master-data/hierarchy");

    return hierarchy.flatMap((warehouse) => warehouse.sites);
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return warehouseId ? mockSites.filter((site) => site.warehouseId === warehouseId) : mockSites;
  }
}

export async function createUser(payload: CreateUserPayload): Promise<AppUser> {
  return apiFetch<AppUser>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<AppUser> {
  return apiFetch<AppUser>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
