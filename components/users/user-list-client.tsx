"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppUser, Site, Warehouse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { RolePill } from "@/components/shared/role-pill";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UserListClientProps = {
  users: AppUser[];
  warehouses: Warehouse[];
  sites: Site[];
};

export function UserListClient({ users, warehouses, sites }: UserListClientProps) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [warehouseId, setWarehouseId] = useState("all");
  const [siteId, setSiteId] = useState("all");
  const [status, setStatus] = useState("all");

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.employeeCode.toLowerCase().includes(term);
      const matchesRole = role === "all" || user.role === role;
      const matchesWarehouse = warehouseId === "all" || user.warehouseId === warehouseId;
      const matchesSite = siteId === "all" || user.siteIds.includes(siteId);
      const matchesStatus = status === "all" || user.status === status;
      return matchesSearch && matchesRole && matchesWarehouse && matchesSite && matchesStatus;
    });
  }, [users, search, role, warehouseId, siteId, status]);

  const warehouseName =
    (id: string) => warehouses.find((warehouse) => warehouse.id === id)?.name ?? "Unknown";
  const siteNames = (ids: string[]) =>
    ids
      .map((id) => sites.find((site) => site.id === id)?.code)
      .filter(Boolean)
      .join(", ");

  return (
    <div className="grid gap-6">
      <PageHeader
        title="User Management"
        description="Create, assign and maintain stock take users across warehouses, audit teams and operational sites."
        actions={
          <Button asChild className="h-12">
            <Link href="/users/new">
              <Plus className="h-4 w-4" />
              New user
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 tablet:grid-cols-4">
        {[
          ["Total users", String(users.length)],
          ["Active users", String(users.filter((user) => user.status === "active").length)],
          ["Warehouses covered", String(new Set(users.map((user) => user.warehouseId)).size)],
          ["Auditors assigned", String(users.filter((user) => user.role === "Auditor").length)],
        ].map(([label, value]) => (
          <div key={label} className="surface-panel grid gap-2 p-5">
            <div className="text-sm font-semibold text-muted-foreground">{label}</div>
            <div className="metric-kpi text-3xl">{value}</div>
          </div>
        ))}
      </div>

      <FilterToolbar>
        <div className="relative tablet:col-span-2 xl:col-span-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search name, email, code"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="all">All roles</option>
          <option value="Admin">Admin</option>
          <option value="Auditor">Auditor</option>
          <option value="Warehouse">Warehouse</option>
        </Select>
        <Select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
          <option value="all">All warehouses</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </Select>
        <Select value={siteId} onChange={(event) => setSiteId(event.target.value)}>
          <option value="all">All sites</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FilterToolbar>

      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No users match the current filters"
          description="Adjust the search or filters to find assigned users, or create a new profile for the warehouse network."
          action={
            <Button asChild>
              <Link href="/users/new">Create user</Link>
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Operational user directory"
          description="Enterprise table foundation with role, warehouse, site and active status visibility."
        >
          <div className="overflow-hidden rounded-[24px] border border-border/80 bg-white">
            <div className="max-w-full overflow-auto">
              <Table>
                <TableHeader className="bg-muted/70">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Sites</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="grid gap-1">
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.employeeCode} | {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RolePill role={user.role} />
                      </TableCell>
                      <TableCell>{warehouseName(user.warehouseId)}</TableCell>
                      <TableCell>{siteNames(user.siteIds)}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" asChild>
                          <Link href={`/users/${user.id}`}>Manage</Link>
                        </Button>
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
