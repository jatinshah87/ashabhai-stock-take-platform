"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  AppUser,
  CountMethod,
  CreateStockTakePlanPayload,
  Location,
  Site,
  StockTakePlan,
  UpdateStockTakePlanPayload,
  Warehouse,
} from "@/lib/types";
import { PlanScopeSelector } from "@/components/stocktake/plan-scope-selector";
import { SearchableUserSelect } from "@/components/shared/searchable-user-select";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { createPlan, updatePlan } from "@/lib/services/stocktake";

type PlanFormProps = {
  mode: "create" | "edit";
  plan?: StockTakePlan | null;
  warehouses: Warehouse[];
  sites: Site[];
  locations: Location[];
  users: AppUser[];
};

const countMethods: CountMethod[] = ["Blind Count", "Frozen Count", "Cycle Count"];

export function PlanForm({ mode, plan, warehouses, sites, locations, users }: PlanFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: plan?.name ?? "",
    code: plan?.code ?? "",
    description: plan?.description ?? "",
    warehouseId: plan?.warehouseId ?? "",
    siteIds: plan?.siteIds ?? ([] as string[]),
    locationIds: plan?.locationIds ?? ([] as string[]),
    scheduledDate: plan?.scheduledDate ?? "2026-04-25",
    scheduleWindow: plan?.scheduleWindow ?? "09:00 - 17:00",
    firstCountUserId: plan?.firstCountUserId ?? "",
    secondCountUserId: plan?.secondCountUserId ?? "",
    notes: plan?.notes ?? "",
    instructions: plan?.instructions ?? "",
    countMethod: plan?.countMethod ?? ("Blind Count" as CountMethod),
    status: plan?.status ?? "Draft",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scopedUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          !form.warehouseId ||
          user.warehouseId === form.warehouseId ||
          user.role === "Auditor" ||
          user.role === "Admin",
      ),
    [users, form.warehouseId],
  );

  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === form.warehouseId);
  const selectedSites = sites.filter((site) => form.siteIds.includes(site.id));
  const selectedLocations = locations.filter((location) => form.locationIds.includes(location.id));
  const firstCountUser = users.find((user) => user.id === form.firstCountUserId);
  const secondCountUser = users.find((user) => user.id === form.secondCountUserId);

  function resolveUserMeta(user: AppUser) {
    const warehouse = warehouses.find((item) => item.id === user.warehouseId)?.name ?? user.warehouseId;
    const siteCodes = sites
      .filter((site) => user.siteIds.includes(site.id))
      .map((site) => site.code)
      .join(", ");

    return `${warehouse} | Sites ${siteCodes || "Not mapped"}`;
  }

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!form.name.trim()) errors.push("Plan name is required.");
    if (!form.code.trim()) errors.push("Plan code is required.");
    if (!form.warehouseId) errors.push("Select a warehouse.");
    if (!form.siteIds.length) errors.push("Select at least one site.");
    if (!form.locationIds.length) errors.push("Select at least one location.");
    if (!form.firstCountUserId) errors.push("Assign a first count user.");
    if (!form.secondCountUserId) errors.push("Assign a second count user.");
    if (form.firstCountUserId && form.secondCountUserId && form.firstCountUserId === form.secondCountUserId) {
      errors.push("First count and second count users must be different people.");
    }
    return errors;
  }, [form]);

  const readinessChecklist = [
    { label: "Warehouse selected", complete: Boolean(form.warehouseId) },
    { label: "At least one site selected", complete: form.siteIds.length > 0 },
    { label: "At least one location selected", complete: form.locationIds.length > 0 },
    { label: "First count user assigned", complete: Boolean(form.firstCountUserId) },
    { label: "Second count user assigned", complete: Boolean(form.secondCountUserId) },
    {
      label: "Independent counters confirmed",
      complete:
        Boolean(form.firstCountUserId) &&
        Boolean(form.secondCountUserId) &&
        form.firstCountUserId !== form.secondCountUserId,
    },
  ];

  async function handleSubmit() {
    if (validationErrors.length > 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const payload: CreateStockTakePlanPayload | UpdateStockTakePlanPayload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
      warehouseId: form.warehouseId,
      siteIds: form.siteIds,
      locationIds: form.locationIds,
      scheduledDate: form.scheduledDate,
      scheduleWindow: form.scheduleWindow.trim(),
      firstCountUserId: form.firstCountUserId,
      secondCountUserId: form.secondCountUserId,
      notes: form.notes.trim(),
      instructions: form.instructions.trim(),
      countMethod: form.countMethod,
      status: form.status,
    };

    try {
      const savedPlan =
        mode === "create"
          ? await createPlan(payload as CreateStockTakePlanPayload)
          : await updatePlan(plan!.id, payload as UpdateStockTakePlanPayload);

      setSubmitSuccess(mode === "create" ? "Stock take plan created." : "Stock take plan updated.");

      if (mode === "create") {
        router.push(`/stocktake/plans/${savedPlan.id}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save the stock take plan right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
      <div className="grid gap-6">
        <SectionCard
          title="Plan definition"
          description="Define the core identity, scheduling and count method before scoping the warehouse footprint."
        >
          <div className="grid gap-5 tablet:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="plan-name">Plan name</Label>
              <Input id="plan-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-code">Plan code</Label>
              <Input id="plan-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="grid gap-2 tablet:col-span-2">
              <Label htmlFor="plan-description">Description</Label>
              <Textarea
                id="plan-description"
                className="min-h-[110px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scheduled-date">Stock take date</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule-window">Schedule window</Label>
              <Input
                id="schedule-window"
                value={form.scheduleWindow}
                onChange={(e) => setForm({ ...form, scheduleWindow: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="count-method">Count method</Label>
              <Select
                id="count-method"
                value={form.countMethod}
                onChange={(e) => setForm({ ...form, countMethod: e.target.value as CountMethod })}
              >
                {countMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-status">Plan status</Label>
              <Select
                id="plan-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as StockTakePlan["status"] })}
              >
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </Select>
            </div>
          </div>
        </SectionCard>

        <PlanScopeSelector
          warehouses={warehouses}
          sites={sites}
          locations={locations}
          selectedWarehouseId={form.warehouseId}
          selectedSiteIds={form.siteIds}
          selectedLocationIds={form.locationIds}
          onWarehouseChange={(warehouseId) =>
            setForm({
              ...form,
              warehouseId,
              siteIds: [],
              locationIds: [],
              firstCountUserId: "",
              secondCountUserId: "",
            })
          }
          onSiteChange={(siteIds) => setForm({ ...form, siteIds })}
          onLocationChange={(locationIds) => setForm({ ...form, locationIds })}
        />

        <SectionCard
          title="Count instructions"
          description="Guidance shown later to counting teams and audit supervisors during execution."
        >
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="instructions">Count instructions</Label>
              <Textarea
                id="instructions"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Audit notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6">
        <SearchableUserSelect
          title="First count assignment"
          helper="Assign the operational user responsible for the initial physical count. This person should know the warehouse zone."
          users={scopedUsers}
          selectedUserId={form.firstCountUserId}
          onSelect={(userId) => setForm({ ...form, firstCountUserId: userId })}
          excludedUserId={form.secondCountUserId || undefined}
          getMeta={resolveUserMeta}
        />

        <SearchableUserSelect
          title="Second count assignment"
          helper="Assign an independent counter or auditor for verification. The same user cannot be used twice."
          users={scopedUsers}
          selectedUserId={form.secondCountUserId}
          onSelect={(userId) => setForm({ ...form, secondCountUserId: userId })}
          excludedUserId={form.firstCountUserId || undefined}
          getMeta={resolveUserMeta}
        />

        <SectionCard
          title="Scope summary"
          description="Live plan summary showing exactly what the plan will cover."
        >
          <div className="grid gap-4">
            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <div className="text-sm text-muted-foreground">Selected warehouse</div>
              <div className="mt-2 font-semibold">{selectedWarehouse?.name ?? "Not selected"}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                <div className="text-sm text-muted-foreground">Sites selected</div>
                <div className="mt-2 text-2xl font-display font-semibold">{selectedSites.length}</div>
              </div>
              <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                <div className="text-sm text-muted-foreground">Locations selected</div>
                <div className="mt-2 text-2xl font-display font-semibold">{selectedLocations.length}</div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <div className="text-sm text-muted-foreground">First count user</div>
              <div className="mt-2 font-semibold">{firstCountUser?.name ?? "Not assigned"}</div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <div className="text-sm text-muted-foreground">Second count user</div>
              <div className="mt-2 font-semibold">{secondCountUser?.name ?? "Not assigned"}</div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <div className="text-sm text-muted-foreground">Planned schedule</div>
              <div className="mt-2 inline-flex items-center gap-2 font-semibold">
                <CalendarDays className="h-4 w-4 text-primary" />
                {form.scheduledDate} | {form.scheduleWindow}
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Plan readiness checklist</div>
                <StatusBadge status={form.status} />
              </div>
              <div className="grid gap-2">
                {readinessChecklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <span>{item.label}</span>
                    {item.complete ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <ShieldCheck className="h-4 w-4" />
                        Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Validation"
          description="The plan must pass these checks before it is considered ready for execution and backend save."
        >
          {validationErrors.length ? (
            <div className="grid gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {validationErrors.map((error) => (
                <div key={error} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              All required scope and assignment checks are complete. This plan is ready for backend save and later execution wiring.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Actions"
          description="The save action is disabled until the plan passes the required business checks."
        >
          <div className="grid gap-3">
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
                  Saving plan
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  {mode === "create" ? "Create plan" : "Save plan"}
                  <Save className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/stocktake/plans">Back to plans</Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start gap-2" disabled>
              <ClipboardList className="h-4 w-4" />
              Save now writes to the live stock take planning API
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
