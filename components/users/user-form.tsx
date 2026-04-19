"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Save } from "lucide-react";
import {
  AppUser,
  BusinessUserRole,
  CreateUserPayload,
  Site,
  UpdateUserPayload,
  Warehouse,
} from "@/lib/types";
import { RolePill } from "@/components/shared/role-pill";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { createUser, updateUser } from "@/lib/services/users";

type UserFormProps = {
  mode: "create" | "edit";
  user?: AppUser | null;
  warehouses: Warehouse[];
  sites: Site[];
};

const roleOptions: BusinessUserRole[] = ["Admin", "Auditor", "Warehouse"];

export function UserForm({ mode, user, warehouses, sites }: UserFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    employeeCode: user?.employeeCode ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? ("Warehouse" as BusinessUserRole),
    warehouseId: user?.warehouseId ?? warehouses[0]?.id ?? "",
    siteIds: user?.siteIds ?? ([] as string[]),
    status: user?.status ?? "active",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSites = useMemo(
    () => sites.filter((site) => site.warehouseId === form.warehouseId),
    [form.warehouseId, sites],
  );

  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === form.warehouseId);
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!form.name.trim()) errors.push("Full name is required.");
    if (!form.employeeCode.trim()) errors.push("Employee code is required.");
    if (!form.email.trim()) errors.push("Email is required.");
    if (!form.phone.trim()) errors.push("Phone number is required.");
    if (!form.warehouseId) errors.push("Warehouse assignment is required.");
    if (!form.siteIds.length) errors.push("At least one site must be assigned.");
    return errors;
  }, [form]);

  function toggleSite(siteId: string) {
    setForm((current) => ({
      ...current,
      siteIds: current.siteIds.includes(siteId)
        ? current.siteIds.filter((id) => id !== siteId)
        : [...current.siteIds, siteId],
    }));
  }

  async function handleSubmit() {
    if (validationErrors.length > 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const payload: CreateUserPayload | UpdateUserPayload = {
      name: form.name.trim(),
      employeeCode: form.employeeCode.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
      warehouseId: form.warehouseId,
      siteIds: form.siteIds,
      status: form.status,
    };

    try {
      const savedUser =
        mode === "create"
          ? await createUser(payload as CreateUserPayload)
          : await updateUser(user!.id, payload as UpdateUserPayload);

      setSubmitSuccess(mode === "create" ? "User created successfully." : "User updated successfully.");

      if (mode === "create") {
        router.push(`/users/${savedUser.id}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save the user right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
      <div className="grid gap-6">
        <SectionCard
          title="User details"
          description="Structured two-column form for enterprise user administration and operational assignment."
        >
          <div className="grid gap-5 tablet:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="user-name">Full name</Label>
              <Input id="user-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="employee-code">Employee code</Label>
              <Input
                id="employee-code"
                value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Role and assignment"
          description="Operational access, warehouse ownership and site-level responsibility mapping."
        >
          <div className="grid gap-5">
            <div className="grid gap-5 tablet:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="role">Role assignment</Label>
                <Select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as BusinessUserRole })}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="warehouse">Warehouse assignment</Label>
                <Select
                  id="warehouse"
                  value={form.warehouseId}
                  onChange={(e) => setForm({ ...form, warehouseId: e.target.value, siteIds: [] })}
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-3">
              <Label>Site assignment</Label>
              <div className="grid gap-3 tablet:grid-cols-2">
                {filteredSites.map((site) => {
                  const selected = form.siteIds.includes(site.id);

                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => toggleSite(site.id)}
                      className={`rounded-3xl border p-4 text-left transition ${
                        selected
                          ? "border-primary/20 bg-primary/5 shadow-soft"
                          : "border-border/70 bg-white hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{site.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{site.code} | {site.type}</div>
                        </div>
                        {selected ? <Badge variant="primary">Selected</Badge> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6">
        <SectionCard
          title="Access summary"
          description="Quick review panel for role, status and site footprint before saving."
        >
          <div className="grid gap-4">
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Current role</div>
              <div className="mt-3">
                <RolePill role={form.role} />
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Warehouse</div>
              <div className="mt-2 font-semibold">{selectedWarehouse?.name ?? "Not selected"}</div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Assigned sites</div>
              <div className="mt-2 text-sm font-semibold">{form.siteIds.length} selected</div>
            </div>
            <div className="flex items-center justify-between rounded-3xl border border-border/70 bg-muted/30 p-4">
              <div>
                <div className="font-semibold">Active access</div>
                <div className="text-sm text-muted-foreground">Controls sign-in availability</div>
              </div>
              <Switch
                checked={form.status === "active"}
                onCheckedChange={(checked) => setForm({ ...form, status: checked ? "active" : "inactive" })}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Actions"
          description="Save directly to the live backend foundation with validation and role-access mapping."
        >
          <div className="grid gap-3">
            {validationErrors.length ? (
              <div className="grid gap-2 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {validationErrors.map((error) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {submitError}
              </div>
            ) : null}

            {submitSuccess ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                {submitSuccess}
              </div>
            ) : null}

            <Button
              className="h-12 justify-between"
              disabled={validationErrors.length > 0 || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  Saving user
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  {mode === "create" ? "Create user" : "Save changes"}
                  <Save className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/users">Back to users</Link>
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
