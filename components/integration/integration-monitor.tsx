import Link from "next/link";
import { AlertTriangle, ArrowRight, DatabaseZap, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IntegrationJobsResponse } from "@/lib/types";
import { IntegrationStatusBadge } from "./integration-status-badge";

function formatImportType(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "In progress";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function IntegrationMonitor({
  data,
  backendUnavailable,
}: {
  data: IntegrationJobsResponse;
  backendUnavailable?: boolean;
}) {
  const totalFailed = data.jobs.reduce((sum, job) => sum + job.failedCount, 0);
  const totalProcessed = data.jobs.reduce((sum, job) => sum + job.totalRecords, 0);
  const successfulJobs = data.jobs.filter((job) => job.status === "SUCCESS").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="QAD Integration Monitor"
        description="Review recent ERP import jobs, stock snapshot refresh health, and record-level exceptions before operational counting begins."
        actions={
          <Button variant="secondary" asChild>
            <Link href="/settings">
              Settings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {backendUnavailable ? (
        <SectionCard title="Backend required" description="Integration monitoring uses live import job data from the NestJS backend and PostgreSQL database.">
          <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            <p>Start the backend API and database to view live QAD import jobs and sync summaries.</p>
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-5 tablet:grid-cols-4">
        <SectionCard title="Recent jobs" description="Latest monitored import batches.">
          <div className="text-4xl font-semibold text-foreground">{data.jobs.length}</div>
        </SectionCard>
        <SectionCard title="Records received" description="Across recent import batches.">
          <div className="text-4xl font-semibold text-foreground">{totalProcessed}</div>
        </SectionCard>
        <SectionCard title="Successful jobs" description="Completed without record failure.">
          <div className="text-4xl font-semibold text-foreground">{successfulJobs}</div>
        </SectionCard>
        <SectionCard title="Failed records" description="Exceptions requiring admin review.">
          <div className="text-4xl font-semibold text-rose-700">{totalFailed}</div>
        </SectionCard>
      </div>

      <div className="grid gap-5 tablet:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Recent import jobs"
          description="Idempotent ERP loads for master data, barcodes, UOM mappings, and stock snapshots."
        >
          {data.jobs.length ? (
            <div className="overflow-hidden rounded-3xl border border-border/80">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Import type</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Records</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                    <th className="px-4 py-3 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.jobs.map((job) => (
                    <tr key={job.id} className="border-t border-border/70 align-top">
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{formatImportType(job.importType)}</div>
                        <div className="text-xs text-muted-foreground">{job.id}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{job.sourceSystem}</div>
                        <div className="text-xs text-muted-foreground">{job.sourceLabel ?? "ERP import batch"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <IntegrationStatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-4 font-medium text-foreground">{job.totalRecords}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="success">+{job.insertedCount} inserted</Badge>
                          <Badge variant="primary">~{job.updatedCount} updated</Badge>
                          <Badge variant="outline">{job.skippedCount} skipped</Badge>
                          {job.failedCount ? <Badge variant="danger">{job.failedCount} failed</Badge> : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{formatDate(job.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/80 bg-muted/20 px-5 py-8 text-sm text-muted-foreground">
              No import jobs have been recorded yet. Use the integration APIs to push QAD master data or stock snapshots into the application.
            </div>
          )}
        </SectionCard>

        <div className="grid gap-5">
          <SectionCard title="Latest stock snapshot import" description="Most recent ERP inventory reference feed used by variance and counting workflows.">
            {data.latestSnapshotImport ? (
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Snapshot batch</div>
                  <IntegrationStatusBadge status={data.latestSnapshotImport.status} />
                </div>
                <div className="text-3xl font-semibold text-foreground">{data.latestSnapshotImport.totalRecords}</div>
                <div className="text-sm text-muted-foreground">
                  Completed {formatDate(data.latestSnapshotImport.completedAt)}
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div>Inserted: {data.latestSnapshotImport.insertedCount}</div>
                  <div>Updated: {data.latestSnapshotImport.updatedCount}</div>
                  <div>Skipped: {data.latestSnapshotImport.skippedCount}</div>
                  <div>Failed: {data.latestSnapshotImport.failedCount}</div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <DatabaseZap className="h-8 w-8 text-primary" />
                <p className="text-sm leading-6">No stock snapshot import has been recorded yet.</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Exception sample" description="Recent record-level failures captured for admin review and replay planning.">
            {data.jobs.some((job) => job.sampleErrors.length) ? (
              <div className="grid gap-3">
                {data.jobs
                  .flatMap((job) =>
                    job.sampleErrors.map((error, index) => ({
                      id: `${job.id}-${index}`,
                      importType: job.importType,
                      ...error,
                    })),
                  )
                  .slice(0, 6)
                  .map((error) => (
                    <div key={error.id} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                      <div className="text-sm font-medium text-rose-900">{formatImportType(error.importType)}</div>
                      <div className="text-xs text-rose-800">
                        Record {error.recordIndex + 1}
                        {error.externalKey ? ` | ${error.externalKey}` : ""}
                      </div>
                      <div className="mt-1 text-sm text-rose-900">{error.message ?? "Unknown import failure"}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <RefreshCcw className="h-8 w-8 text-primary" />
                <p className="text-sm leading-6">No failed records are currently queued in recent import jobs.</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
