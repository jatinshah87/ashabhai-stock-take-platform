import type { ReactNode } from "react";
import { DashboardPageData } from "@/lib/types";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ActivityList } from "@/components/dashboard/activity-list";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MiniStatusTable } from "@/components/dashboard/mini-status-table";

export function DashboardTemplate({
  data,
  note,
}: {
  data: DashboardPageData;
  note?: ReactNode;
}) {
  return (
    <DashboardShell title={data.title} description={data.description}>
      <div className="tablet-grid">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="xl:col-span-3">
            <MetricCard metric={metric} />
          </div>
        ))}

        <div className="xl:col-span-7">
          <DashboardChart
            title="Operational trend"
            description="Reusable chart pattern for plan progress, variance or throughput signals."
            data={data.trend}
          />
        </div>

        <div className="xl:col-span-5">
          <ActivityList
            title="Priority work"
            description="Task, exception and action panels tuned for operational scanning."
            items={data.tasks}
          />
        </div>

        <div className="xl:col-span-7">
          <MiniStatusTable />
        </div>

        <div className="xl:col-span-5">
          <ActivityList
            title="Alerts & notes"
            description="Persistent but restrained system and operational feedback."
            items={data.alerts}
          />
        </div>

        {note ? <div className="xl:col-span-12">{note}</div> : null}
      </div>
    </DashboardShell>
  );
}
