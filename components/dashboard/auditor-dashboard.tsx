import { dashboards } from "@/lib/mock-data";
import { DashboardTemplate } from "@/components/dashboard/dashboard-template";

export function AuditorDashboard() {
  return <DashboardTemplate data={dashboards.auditor} />;
}
