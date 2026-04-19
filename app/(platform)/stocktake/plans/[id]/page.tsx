import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PlanForm } from "@/components/stocktake/plan-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { getPlanById, getPlanningReferenceData } from "@/lib/services/stocktake";

export default async function StockTakePlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [plan, referenceData] = await Promise.all([getPlanById(id), getPlanningReferenceData()]);

  if (!plan) notFound();

  return (
    <div className="grid gap-6">
      <PageHeader
        title={plan.name}
        description="Review the count plan, refine hierarchical scope, and confirm separated assignment ownership before execution."
        actions={<StatusBadge status={plan.status} />}
      />
      <PlanForm
        mode="edit"
        plan={plan}
        warehouses={referenceData.warehouses}
        sites={referenceData.sites}
        locations={referenceData.locations}
        users={referenceData.users}
      />
    </div>
  );
}
