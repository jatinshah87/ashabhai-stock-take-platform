import { CalendarView } from "@/components/stocktake/calendar-view";
import { getPlanningReferenceData, getPlans } from "@/lib/services/stocktake";

export default async function StockTakeCalendarPage() {
  const [plans, referenceData] = await Promise.all([getPlans(), getPlanningReferenceData()]);

  return (
    <CalendarView
      plans={plans}
      warehouses={referenceData.warehouses}
      users={referenceData.users}
      sites={referenceData.sites}
      locations={referenceData.locations}
    />
  );
}
