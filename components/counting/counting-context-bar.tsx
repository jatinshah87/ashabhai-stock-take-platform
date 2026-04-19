"use client";

import { Badge } from "@/components/ui/badge";
import { CountTypeCode, ExecutionPlanDetail } from "@/lib/types";

function toCountLabel(countType: CountTypeCode) {
  return countType === "FIRST" ? "First Count" : "Second Count";
}

export function CountingContextBar({
  plan,
  countType,
  locationLabel,
}: {
  plan: ExecutionPlanDetail;
  countType: CountTypeCode;
  locationLabel?: string;
}) {
  return (
    <div className="sticky top-3 z-20 rounded-[28px] border border-border/80 bg-white/95 p-4 shadow-panel backdrop-blur">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{toCountLabel(countType)}</Badge>
            <Badge variant={plan.submission.readOnly ? "warning" : "outline"}>
              {plan.submission.readOnly ? "Read only" : "Editable"}
            </Badge>
          </div>
          <div className="text-lg font-semibold text-foreground">{plan.name}</div>
          <div className="text-sm text-muted-foreground">
            {plan.code} | {plan.warehouse.name} | {plan.sites.length} sites | {plan.locations.length} locations
          </div>
        </div>
        <div className="grid gap-2 text-sm tablet:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Schedule</div>
            <div className="mt-1 font-semibold">{plan.progress.entryCount} lines saved</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Window</div>
            <div className="mt-1 font-semibold">{plan.status} | {plan.submission.status}</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Current location</div>
            <div className="mt-1 font-semibold">{locationLabel ?? "Not scanned"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
