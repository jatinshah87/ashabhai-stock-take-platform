import { PageHeader } from "@/components/layout/page-header";
import { PlanForm } from "@/components/stocktake/plan-form";
import { getPlanningReferenceData } from "@/lib/services/stocktake";

export default async function NewStockTakePlanPage() {
  const referenceData = await getPlanningReferenceData();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Create Stock Take Plan"
        description="Build a warehouse, site and location-scoped plan with separated first and second count ownership."
      />
      <PlanForm
        mode="create"
        warehouses={referenceData.warehouses}
        sites={referenceData.sites}
        locations={referenceData.locations}
        users={referenceData.users}
      />
    </div>
  );
}
