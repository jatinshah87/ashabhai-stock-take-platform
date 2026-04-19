"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAnomalySummary, listAnomalies, runAnomalyDetection } from "@/lib/services/anomalies";
import { AnomalyFilters, AnomalyListItem, AnomalySummaryResponse, Site, StockTakePlan, Warehouse } from "@/lib/types";

export function AnomalyListClient({
  warehouses,
  sites,
  plans,
}: {
  warehouses: Warehouse[];
  sites: Site[];
  plans: StockTakePlan[];
}) {
  const [filters, setFilters] = useState<AnomalyFilters>({});
  const [rows, setRows] = useState<AnomalyListItem[]>([]);
  const [summary, setSummary] = useState<AnomalySummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [items, summaryData] = await Promise.all([
        listAnomalies(filters),
        getAnomalySummary(filters),
      ]);
      setRows(items);
      setSummary(summaryData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load anomalies.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [JSON.stringify(filters)]);

  async function handleRun() {
    setIsRunning(true);
    setMessage(null);
    try {
      const result = await runAnomalyDetection({
        warehouseId: filters.warehouseId,
        siteId: filters.siteId,
        planId: filters.planId,
      });
      setMessage(`Anomaly run completed. Created ${result.created}, updated ${result.updated}, closed ${result.closed}.`);
      await loadData();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run anomaly detection.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Anomaly Monitor"
        description="Rule-based exception visibility for variance risk, suspicious counting patterns, sync conflict concentration, and stale data conditions."
        actions={
          <>
            <Button variant="secondary" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleRun} disabled={isRunning}>
              <ShieldAlert className="h-4 w-4" />
              {isRunning ? "Running..." : "Run anomaly scan"}
            </Button>
          </>
        }
      />

      <SectionCard title="Filters" description="Refine anomalies by warehouse, site, plan, severity, status, or date window.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="grid gap-2">
            <Label>Warehouse</Label>
            <Select value={filters.warehouseId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, warehouseId: event.target.value || undefined, siteId: undefined, planId: undefined }))}>
              <option value="">All warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Site</Label>
            <Select value={filters.siteId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, siteId: event.target.value || undefined }))}>
              <option value="">All sites</option>
              {sites.filter((site) => !filters.warehouseId || site.warehouseId === filters.warehouseId).map((site) => (
                <option key={site.id} value={site.id}>{site.code}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Plan</Label>
            <Select value={filters.planId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, planId: event.target.value || undefined }))}>
              <option value="">All plans</option>
              {plans.filter((plan) => !filters.warehouseId || plan.warehouseId === filters.warehouseId).map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.code}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Severity</Label>
            <Select value={filters.severity ?? ""} onChange={(event) => setFilters((current) => ({ ...current, severity: (event.target.value as AnomalyFilters["severity"]) || undefined }))}>
              <option value="">All severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={filters.status ?? ""} onChange={(event) => setFilters((current) => ({ ...current, status: (event.target.value as AnomalyFilters["status"]) || undefined }))}>
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Date from</Label>
            <Input type="date" value={filters.dateFrom ?? ""} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value || undefined }))} />
          </div>
        </div>
      </SectionCard>

      {summary ? (
        <div className="grid gap-4 xl:grid-cols-4">
          {[
            ["Open anomalies", summary.totalOpen, "danger"],
            ["Reviewed anomalies", summary.totalReviewed, "warning"],
            ["Closed anomalies", summary.totalClosed, "success"],
            ["Critical findings", summary.severityDistribution.find((item) => item.label === "CRITICAL")?.value ?? 0, "danger"],
          ].map(([label, value, tone]) => (
            <div key={String(label)} className="rounded-[28px] border border-border/70 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-muted-foreground">{label}</div>
                <Badge variant={tone as "danger" | "warning" | "success"}>{tone}</Badge>
              </div>
              <div className="mt-4 text-4xl font-semibold">{value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div> : null}

      {isLoading ? (
        <SectionCard title="Loading anomalies">
          <div className="flex min-h-[260px] items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SectionCard>
      ) : error ? (
        <ErrorState title="Unable to load anomalies" description={error} onRetry={loadData} />
      ) : (
        <SectionCard title="Anomaly list" description="Operational exception list for audit and management review.">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge variant={row.severity === "CRITICAL" || row.severity === "HIGH" ? "danger" : row.severity === "MEDIUM" ? "warning" : "outline"}>
                        {row.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.anomalyType.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      <Link className="font-semibold text-primary" href={`/anomalies/${row.id}`}>
                        {row.summary}
                      </Link>
                      <div className="mt-1 text-xs text-muted-foreground">{row.itemCode ?? row.userName ?? row.warehouseName ?? "Cross-system anomaly"}</div>
                    </TableCell>
                    <TableCell>{row.planCode ?? "-"}</TableCell>
                    <TableCell>{row.locationCode ?? row.siteCode ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === "OPEN" ? "danger" : row.status === "REVIEWED" ? "warning" : "success"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(row.detectedAt))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
