"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { isBackendUnavailable } from "@/lib/api/http";
import { downloadReport, getReport } from "@/lib/services/reports";
import { ReportFilters, ReportResponse, ReportType, Warehouse, Site, Location, StockTakePlan } from "@/lib/types";
import { ReportFiltersPanel } from "./report-filters";
import { ReportKpis } from "./report-kpis";
import { ReportTable } from "./report-table";

const reportMeta: Record<ReportType, { title: string; description: string }> = {
  "first-vs-second": {
    title: "First Count vs Second Count",
    description: "Compares submitted first and second counts to surface recount mismatches and operational discrepancies.",
  },
  "system-vs-first": {
    title: "System Stock vs First Count",
    description: "Shows how the first warehouse count differs from the system stock snapshot at plan scope.",
  },
  "system-vs-second": {
    title: "System Stock vs Second Count",
    description: "Shows how the independent verification count differs from the reference stock snapshot.",
  },
  "final-variance": {
    title: "Final Variance Report",
    description: "Combined reconciliation view showing system stock, first count, second count, and final variance severity.",
  },
};

export function ReportClient({
  type,
  warehouses,
  sites,
  locations,
  plans,
}: {
  type: ReportType;
  warehouses: Warehouse[];
  sites: Site[];
  locations: Location[];
  plans: StockTakePlan[];
}) {
  const [filters, setFilters] = useState<ReportFilters>({ severity: "all" });
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getReport(type, filters)
      .then((data) => {
        if (active) {
          setReport(data);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(
            isBackendUnavailable(loadError)
              ? "Reporting requires the backend API and database. Start the NestJS backend on http://localhost:4000 to load live variance data."
              : loadError instanceof Error
                ? loadError.message
                : "Unable to load report.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [type, filters]);

  async function handleExport() {
    setIsExporting(true);
    try {
      await downloadReport(type, filters);
    } catch (exportError) {
      setError(
        isBackendUnavailable(exportError)
          ? "Excel export requires the backend API and database. Start the NestJS backend on http://localhost:4000 and try again."
          : exportError instanceof Error
            ? exportError.message
            : "Unable to export report.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  const meta = reportMeta[type];

  return (
    <div className="grid gap-6">
      <PageHeader
        title={meta.title}
        description={meta.description}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/reports">All reports</Link>
            </Button>
            <Button onClick={handleExport} disabled={!report || isExporting}>
              {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Excel
            </Button>
          </>
        }
      />

      <ReportFiltersPanel
        filters={filters}
        onChange={setFilters}
        warehouses={warehouses}
        sites={sites}
        locations={locations}
        plans={plans}
      />

      {isLoading ? (
        <SectionCard title="Loading report">
          <div className="flex min-h-[260px] items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SectionCard>
      ) : error || !report ? (
        <EmptyState
          title="Unable to load report"
          description={error ?? "The requested variance report is unavailable."}
          action={
            <Button asChild>
              <Link href={`/reports/${type}`}>Retry</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ReportKpis summary={report.summary} />
          <SectionCard title="Variance detail" description="Filterable operational table with report-ready variance output and severity highlighting.">
            <ReportTable rows={report.rows} />
          </SectionCard>
        </>
      )}
    </div>
  );
}
