import { AnomalyListClient } from "@/components/anomalies/anomaly-list-client";
import { sites, stockTakePlans, warehouses } from "@/lib/mock-data";

export default function AnomaliesPage() {
  return (
    <AnomalyListClient
      warehouses={warehouses}
      sites={sites}
      plans={stockTakePlans}
    />
  );
}
