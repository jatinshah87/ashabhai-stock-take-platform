import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dashboards } from "@/lib/mock-data";
import { DashboardTemplate } from "@/components/dashboard/dashboard-template";

export function ManagementDashboard() {
  return (
    <DashboardTemplate
      data={dashboards.management}
      note={
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="grid gap-2">
              <h2 className="text-2xl font-semibold">Management dashboard is intentionally lightweight in Phase 1</h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                The shell, layout language and executive route are ready. Detailed hotspot matrices, delay boards and enterprise reporting views can plug into this framework in the next phase without restructuring the app.
              </p>
            </div>
            <Badge variant="warning" className="w-fit px-4 py-2 text-sm">
              Placeholder board
            </Badge>
          </CardContent>
        </Card>
      }
    />
  );
}
