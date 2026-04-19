import { dashboards } from "@/lib/mock-data";
import { DashboardTemplate } from "@/components/dashboard/dashboard-template";

export function AdminDashboard() {
  return <DashboardTemplate data={dashboards["system-admin"]} />;
}
