"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, DatabaseZap, LoaderCircle, RefreshCw, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AnomalySummaryResponse,
  AnalyticsFilters,
  AppRole,
  AppUser,
  CompletionTrendsResponse,
  IntegrationHealthResponse,
  ManagementSummaryResponse,
  OperationalSummaryResponse,
  ProductivityResponse,
  Site,
  SiteProgressRow,
  StockTakePlan,
  SyncHealthResponse,
  VarianceHotspotsResponse,
  Warehouse,
  WarehouseProgressRow,
} from "@/lib/types";
import { AnalyticsFiltersPanel } from "./analytics-filters";
import {
  getCompletionTrends,
  getIntegrationHealth,
  getManagementSummary,
  getOperationalSummary,
  getProductivity,
  getSiteProgress,
  getSyncHealth,
  getVarianceHotspots,
  getWarehouseProgress,
} from "@/lib/services/analytics";
import { getPlanningReferenceData, getPlans } from "@/lib/services/stocktake";
import { getAnomalySummary } from "@/lib/services/anomalies";
import { isBackendUnavailable } from "@/lib/api/http";
import { getStoredAppRole } from "@/lib/services/session";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const severityColors = ["#173765", "#5d718d", "#bf2430", "#f59e0b"];

type DashboardPayload = {
  operationalSummary: OperationalSummaryResponse | null;
  managementSummary: ManagementSummaryResponse | null;
  warehouseProgress: WarehouseProgressRow[];
  siteProgress: SiteProgressRow[];
  varianceHotspots: VarianceHotspotsResponse | null;
  productivity: ProductivityResponse | null;
  syncHealth: SyncHealthResponse | null;
  integrationHealth: IntegrationHealthResponse | null;
  completionTrends: CompletionTrendsResponse | null;
  anomalySummary: AnomalySummaryResponse | null;
};

export function AnalyticsDashboardClient({
  role,
  mode = "operational",
}: {
  role?: AppRole;
  mode?: "operational" | "management";
}) {
  const [effectiveRole, setEffectiveRole] = useState<AppRole>(role ?? "system-admin");
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [references, setReferences] = useState<{
    warehouses: Warehouse[];
    sites: Site[];
    users: AppUser[];
    plans: StockTakePlan[];
  }>({
    warehouses: [],
    sites: [],
    users: [],
    plans: [],
  });
  const [data, setData] = useState<DashboardPayload>({
    operationalSummary: null,
    managementSummary: null,
    warehouseProgress: [],
    siteProgress: [],
    varianceHotspots: null,
    productivity: null,
    syncHealth: null,
    integrationHealth: null,
    completionTrends: null,
    anomalySummary: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setEffectiveRole(role);
      return;
    }

    const storedRole = getStoredAppRole();
    if (storedRole) {
      setEffectiveRole(storedRole);
    }
  }, [role]);

  useEffect(() => {
    let active = true;

    Promise.all([getPlanningReferenceData(), getPlans()])
      .then(([referenceData, plans]) => {
        if (!active) return;
        setReferences({
          warehouses: referenceData.warehouses,
          sites: referenceData.sites,
          users: referenceData.users,
          plans,
        });
      })
      .catch(() => {
        if (!active) return;
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getOperationalSummary(filters),
      mode === "management" ? getManagementSummary(filters) : Promise.resolve(null),
      getWarehouseProgress(filters),
      getSiteProgress(filters),
      getVarianceHotspots(filters),
      getProductivity(filters),
      getSyncHealth(filters),
      getIntegrationHealth(filters),
      getCompletionTrends(filters),
      getAnomalySummary({
        warehouseId: filters.warehouseId,
        siteId: filters.siteId,
        planId: filters.planId,
        severity: mapVarianceSeverityToAnomaly(filters.severity),
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
    ])
      .then(
        ([
          operationalSummary,
          managementSummary,
          warehouseProgress,
          siteProgress,
          varianceHotspots,
          productivity,
          syncHealth,
          integrationHealth,
          completionTrends,
          anomalySummary,
        ]) => {
          if (!active) return;
          setData({
            operationalSummary,
            managementSummary,
            warehouseProgress: warehouseProgress.rows,
            siteProgress: siteProgress.rows,
            varianceHotspots,
            productivity,
            syncHealth,
            integrationHealth,
            completionTrends,
            anomalySummary,
          });
        },
      )
      .catch((loadError) => {
        if (!active) return;
        setError(
          isBackendUnavailable(loadError)
            ? "Analytics requires the backend API and database. Start the NestJS backend on http://localhost:4000 to load live KPI and BI data."
            : loadError instanceof Error
              ? loadError.message
              : "Unable to load analytics.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, mode]);

  const header = useMemo(() => {
    if (mode === "management") {
      return {
        title: "Management Dashboard",
        description:
          "Executive stock take visibility across completion, variance risk, sync exceptions, and ERP refresh health.",
      };
    }

    if (effectiveRole === "auditor") {
      return {
        title: "Audit Analytics",
        description:
          "Monitor first and second count readiness, variance hotspots, and execution gaps across active stock take plans.",
      };
    }

    if (effectiveRole === "warehouse-user") {
      return {
        title: "Operational Analytics",
        description:
          "Shift-friendly execution metrics showing workload, completion status, and local sync health for warehouse counting.",
      };
    }

    return {
      title: "Operational Analytics",
      description:
        "System-wide stock take visibility across plan progress, sync health, productivity, and reconciliation risk.",
    };
  }, [effectiveRole, mode]);

  const kpis = useMemo(() => {
    if (mode === "management" && data.managementSummary) {
      return [
        {
          label: "Network completion",
          value: `${data.managementSummary.kpis.networkCompletionRate}%`,
          helper: "Weighted completion across scheduled plan scope",
          tone: "primary" as const,
        },
        {
          label: "Active plans",
          value: String(data.managementSummary.kpis.activePlans),
          helper: "Plans still progressing across the network",
          tone: "success" as const,
        },
        {
          label: "Open variance items",
          value: String(data.managementSummary.kpis.openVarianceItems),
          helper: "Mismatched lines needing closure or review",
          tone: "danger" as const,
        },
        {
          label: "Open anomalies",
          value: String(data.anomalySummary?.totalOpen ?? 0),
          helper: "Rule-based exception findings still open",
          tone: "warning" as const,
        },
        {
          label: "Unresolved conflicts",
          value: String(data.managementSummary.kpis.unresolvedConflicts),
          helper: "Sync and execution exceptions still open",
          tone: "warning" as const,
        },
      ].slice(0, 4);
    }

    if (!data.operationalSummary) {
      return [];
    }

    return [
      {
        label: "Plans in scope",
        value: String(data.operationalSummary.kpis.totalPlans),
        helper: "All plans matching current filters",
        tone: "primary" as const,
      },
      {
        label: "Locations counted",
        value: String(data.operationalSummary.kpis.locationsCounted),
        helper: `Out of ${data.operationalSummary.kpis.locationsScheduled} scheduled locations`,
        tone: "success" as const,
      },
      {
        label: "First counts pending",
        value: String(data.operationalSummary.kpis.firstCountsPending),
        helper: "Plans waiting for first count submission",
        tone: "warning" as const,
      },
      {
        label: "Locked plans",
        value: String(data.operationalSummary.kpis.lockedPlans),
        helper: "Plans already sealed against edits",
        tone: "danger" as const,
      },
    ];
  }, [data.managementSummary, data.operationalSummary, mode]);

  const showSystemHealth = effectiveRole !== "warehouse-user";

  return (
    <div className="grid gap-6">
      <PageHeader
        title={header.title}
        description={header.description}
        actions={
          <>
            <Button variant="secondary" onClick={() => setFilters({})}>
              Reset filters
            </Button>
            <Button onClick={() => setFilters((current) => ({ ...current }))}>
              <RefreshCw className="h-4 w-4" />
              Refresh analytics
            </Button>
          </>
        }
      />

      <AnalyticsFiltersPanel
        filters={filters}
        warehouses={references.warehouses}
        sites={references.sites}
        plans={references.plans}
        users={references.users}
        onChange={setFilters}
        onReset={() => setFilters({})}
      />

      {isLoading ? (
        <SectionCard title="Loading analytics">
          <div className="flex min-h-[260px] items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SectionCard>
      ) : error ? (
        <ErrorState
          title="Unable to load analytics"
          description={error}
          onRetry={() => setFilters((current) => ({ ...current }))}
        />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-4">
            {kpis.map((kpi, index) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full">
                  <CardContent className="grid gap-4 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground">{kpi.label}</div>
                        <div className="metric-kpi mt-3">{kpi.value}</div>
                      </div>
                      <Badge variant={kpi.tone}>{kpi.tone}</Badge>
                    </div>
                    <div className="text-sm leading-6 text-muted-foreground">{kpi.helper}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <SectionCard
                title="Completion trend"
                description="Plan scheduling, count activity, and completion throughput over time."
              >
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.completionTrends?.points ?? []} margin={{ top: 16, right: 16, left: -12, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d6dfea" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#5d718d", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#5d718d", fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="scheduledPlans" stroke="#173765" strokeWidth={3} />
                      <Line type="monotone" dataKey="countedLines" stroke="#2b8a5a" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="submittedCounts" stroke="#bf2430" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            <div className="xl:col-span-5">
              <SectionCard
                title="Variance severity"
                description="Current mismatch spread by severity so supervisors can prioritize review."
              >
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.varianceHotspots?.severityDistribution ?? []}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={68}
                        outerRadius={112}
                        paddingAngle={3}
                      >
                        {(data.varianceHotspots?.severityDistribution ?? []).map((entry, index) => (
                          <Cell key={entry.label} fill={severityColors[index % severityColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            <div className="xl:col-span-7">
              <SectionCard
                title="Warehouse comparison"
                description="Warehouse-wise completion view with pending counts and exception pressure."
              >
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.warehouseProgress} margin={{ top: 16, right: 16, left: -12, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d6dfea" vertical={false} />
                      <XAxis dataKey="warehouseName" tickLine={false} axisLine={false} tick={{ fill: "#5d718d", fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#5d718d", fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="completionPercent" fill="#173765" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="highVarianceCount" fill="#bf2430" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            <div className="xl:col-span-5">
              <SectionCard
                title="Top variance items"
                description="Most material mismatch lines from the current final variance scope."
              >
                <div className="space-y-3">
                  {data.varianceHotspots?.topItems.slice(0, 5).map((item) => (
                    <div key={item.itemCode} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold">{item.itemCode}</div>
                          <div className="text-sm text-muted-foreground">{item.itemDescription}</div>
                        </div>
                        <Badge variant="danger">{item.totalVarianceQty.toFixed(2)}</Badge>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        Mismatched lines: {item.mismatchCount}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {effectiveRole !== "warehouse-user" ? (
              <div className="xl:col-span-6">
                <SectionCard
                  title="Open anomaly summary"
                  description="Rules-engine findings surfaced from live counts, variances, sync events, and data freshness checks."
                >
                  {data.anomalySummary ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <StatusMiniCard
                        icon={<AlertTriangle className="h-5 w-5 text-danger" />}
                        label="Open anomalies"
                        value={String(data.anomalySummary.totalOpen)}
                      />
                      <StatusMiniCard
                        icon={<RefreshCw className="h-5 w-5 text-warning" />}
                        label="Reviewed anomalies"
                        value={String(data.anomalySummary.totalReviewed)}
                      />
                      <div className="space-y-3 md:col-span-2">
                        {data.anomalySummary.topOpen.slice(0, 3).map((anomaly) => (
                          <div key={anomaly.id} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold">{anomaly.summary}</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {anomaly.planCode ?? "No plan"} · {anomaly.locationCode ?? anomaly.itemCode ?? "Cross-plan"}
                                </div>
                              </div>
                              <Badge variant={anomaly.severity === "CRITICAL" || anomaly.severity === "HIGH" ? "danger" : anomaly.severity === "MEDIUM" ? "warning" : "outline"}>
                                {anomaly.severity}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No anomaly summary available for the current filters.</div>
                  )}
                </SectionCard>
              </div>
            ) : null}

            <div className="xl:col-span-6">
              <SectionCard
                title="Active plan board"
                description="Current live plans with location progress and first/second count state."
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Locations</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.operationalSummary?.activePlans ?? []).slice(0, 6).map((plan) => (
                        <TableRow key={plan.planId}>
                          <TableCell>
                            <div className="font-semibold">{plan.planCode}</div>
                            <div className="text-xs text-muted-foreground">{plan.planName}</div>
                          </TableCell>
                          <TableCell>{plan.warehouseName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                plan.status === "Completed"
                                  ? "success"
                                  : plan.status === "In Progress"
                                    ? "primary"
                                    : "warning"
                              }
                            >
                              {plan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {plan.locationsCounted}/{plan.locationsScheduled}
                          </TableCell>
                          <TableCell>{plan.completionPercent}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>
            </div>

            <div className="xl:col-span-6">
              <SectionCard
                title="First vs second count gap review"
                description="Plans where first count is sealed but second count execution is still outstanding."
              >
                {(data.operationalSummary?.firstSecondGaps.length ?? 0) ? (
                  <div className="space-y-3">
                    {data.operationalSummary?.firstSecondGaps.map((gap) => (
                      <div key={gap.planId} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold">{gap.planCode}</div>
                            <div className="text-sm text-muted-foreground">{gap.warehouseName}</div>
                          </div>
                          <Badge variant="warning">{gap.locationsRemaining} locations</Badge>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          First count: {gap.firstCountUser} · Second count: {gap.secondCountUser}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                    <Activity className="h-8 w-8 text-primary" />
                    <p>No first/second count gaps are open for the current filter set.</p>
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="xl:col-span-6">
              <SectionCard
                title="User productivity"
                description="Throughput view across count performers and submission owners."
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Lines</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>First</TableHead>
                        <TableHead>Second</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.productivity?.users ?? []).slice(0, 8).map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell>{user.userName}</TableCell>
                          <TableCell>{user.countsPerformed}</TableCell>
                          <TableCell>{user.countsSubmitted}</TableCell>
                          <TableCell>{user.firstCountLines}</TableCell>
                          <TableCell>{user.secondCountLines}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>
            </div>

            <div className="xl:col-span-6">
              <SectionCard
                title="Site progress"
                description="Site-level count completion across the filtered warehouse and plan scope."
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Site</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Counted</TableHead>
                        <TableHead>Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.siteProgress.slice(0, 8).map((site) => (
                        <TableRow key={site.siteId}>
                          <TableCell>
                            <div className="font-semibold">{site.siteCode}</div>
                            <div className="text-xs text-muted-foreground">{site.siteName}</div>
                          </TableCell>
                          <TableCell>{site.warehouseName}</TableCell>
                          <TableCell>{site.locationsScheduled}</TableCell>
                          <TableCell>{site.locationsCounted}</TableCell>
                          <TableCell>{site.completionPercent}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>
            </div>

            {mode === "management" && data.managementSummary ? (
              <div className="xl:col-span-12">
                <SectionCard
                  title="Executive issue board"
                  description="Management-focused summary of priority risk items and cross-warehouse exceptions."
                >
                  <div className="grid gap-4 xl:grid-cols-3">
                    {data.managementSummary.topIssues.map((issue) => (
                      <div key={issue.id} className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold">{issue.title}</div>
                          <Badge
                            variant={
                              issue.severity === "high"
                                ? "danger"
                                : issue.severity === "medium"
                                  ? "warning"
                                  : "primary"
                            }
                          >
                            {issue.metric}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{issue.description}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            ) : null}

            {showSystemHealth && data.syncHealth && data.integrationHealth ? (
              <>
                <div className="xl:col-span-6">
                  <SectionCard
                    title="Sync health"
                    description="Queued transaction status, conflict pressure, and replay stability."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <StatusMiniCard
                        icon={<WifiOff className="h-5 w-5 text-warning" />}
                        label="Pending queue"
                        value={String(data.syncHealth.summary.pendingQueueItems)}
                      />
                      <StatusMiniCard
                        icon={<AlertTriangle className="h-5 w-5 text-danger" />}
                        label="Unresolved conflicts"
                        value={String(data.syncHealth.summary.unresolvedConflicts)}
                      />
                      <StatusMiniCard
                        icon={<RefreshCw className="h-5 w-5 text-primary" />}
                        label="Resolved conflicts"
                        value={String(data.syncHealth.summary.resolvedConflicts)}
                      />
                      <StatusMiniCard
                        icon={<Activity className="h-5 w-5 text-muted-foreground" />}
                        label="Avg conflict age"
                        value={`${data.syncHealth.summary.averageConflictAgeHours}h`}
                      />
                    </div>
                  </SectionCard>
                </div>

                <div className="xl:col-span-6">
                  <SectionCard
                    title="Integration health"
                    description="ERP master and stock snapshot refresh quality from the QAD integration layer."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <StatusMiniCard
                        icon={<DatabaseZap className="h-5 w-5 text-success" />}
                        label="Successful jobs"
                        value={String(data.integrationHealth.summary.successfulJobs)}
                      />
                      <StatusMiniCard
                        icon={<AlertTriangle className="h-5 w-5 text-warning" />}
                        label="Partial failures"
                        value={String(data.integrationHealth.summary.partialFailureJobs)}
                      />
                      <StatusMiniCard
                        icon={<AlertTriangle className="h-5 w-5 text-danger" />}
                        label="Failed jobs"
                        value={String(data.integrationHealth.summary.failedJobs)}
                      />
                      <StatusMiniCard
                        icon={<RefreshCw className="h-5 w-5 text-primary" />}
                        label="Latest snapshot"
                        value={formatDate(data.integrationHealth.summary.latestStockSnapshotImport)}
                      />
                    </div>
                  </SectionCard>
                </div>
              </>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function mapVarianceSeverityToAnomaly(
  severity: AnalyticsFilters["severity"],
): "LOW" | "MEDIUM" | "HIGH" | undefined {
  if (!severity || severity === "all" || severity === "matched") return undefined;
  if (severity === "low") return "LOW";
  if (severity === "medium") return "MEDIUM";
  if (severity === "high") return "HIGH";
  return undefined;
}

function StatusMiniCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "No import";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
