import { PlanListClient } from "@/components/stocktake/plan-list-client";
import { getPlanningReferenceData, getPlans } from "@/lib/services/stocktake";

export default async function StockTakePlansPage() {
  const [plans, referenceData] = await Promise.all([getPlans(), getPlanningReferenceData()]);

  return (
    <PlanListClient
      plans={plans}
      warehouses={referenceData.warehouses}
      sites={referenceData.sites}
      locations={referenceData.locations}
      users={referenceData.users}
    />
  );
}
