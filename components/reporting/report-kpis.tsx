import { ReportSummary } from "@/lib/types";

export function ReportKpis({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid gap-4 tablet:grid-cols-2 xl:grid-cols-7">
      {[
        ["Items compared", String(summary.totalItemsCompared)],
        ["Variance qty", String(summary.totalVarianceQuantity)],
        ["Mismatched", String(summary.mismatchedItems)],
        ["Matched", String(summary.matchedItems)],
        ["High", String(summary.highVarianceCount)],
        ["Medium", String(summary.mediumVarianceCount)],
        ["Low", String(summary.lowVarianceCount)],
      ].map(([label, value]) => (
        <div key={label} className="surface-panel grid gap-2 p-5">
          <div className="text-sm font-semibold text-muted-foreground">{label}</div>
          <div className="metric-kpi text-3xl">{value}</div>
        </div>
      ))}
    </div>
  );
}
