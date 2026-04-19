import { ReportClient } from "@/components/reporting/report-client";
import { getPlanningReferenceData, getPlans } from "@/lib/services/stocktake";

export default async function SystemVsFirstReportPage() {
  const [referenceData, plans] = await Promise.all([getPlanningReferenceData(), getPlans()]);
  return (
    <ReportClient
      type="system-vs-first"
      warehouses={referenceData.warehouses}
      sites={referenceData.sites}
      locations={referenceData.locations}
      plans={plans}
    />
  );
}
