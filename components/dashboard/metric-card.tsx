import { ArrowUpRight } from "lucide-react";
import { DashboardMetric } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const toneMap = {
  primary: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
} as const;

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <Card className="h-full">
      <CardContent className="grid gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-muted-foreground">{metric.label}</div>
            <div className="metric-kpi mt-3">{metric.value}</div>
          </div>
          <Badge variant={toneMap[metric.tone]} className="px-3 py-1.5">
            {metric.delta}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm leading-6 text-muted-foreground">
          <span>{metric.helper}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}
