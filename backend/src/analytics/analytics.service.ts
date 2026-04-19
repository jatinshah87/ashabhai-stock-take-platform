import { Injectable } from "@nestjs/common";
import { ConflictStatus, CountType, Prisma, SubmissionStatus } from "@prisma/client";
import { AuditLogService } from "src/audit-log/audit-log.service";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { QueryAnalyticsDto } from "./dto/query-analytics.dto";

type Severity = "matched" | "low" | "medium" | "high";

type VarianceRow = {
  planId: string;
  planCode: string;
  warehouseId: string;
  warehouseName: string;
  siteId: string;
  siteCode: string;
  locationId: string;
  locationCode: string;
  itemId: string;
  itemCode: string;
  itemDescription: string;
  uomCode: string;
  systemQty: number;
  firstQty: number;
  secondQty: number;
  firstVarianceQty: number;
  secondVarianceQty: number;
  betweenCountsQty: number;
  finalVarianceQty: number;
  firstVariancePercent: number;
  secondVariancePercent: number;
  betweenCountsPercent: number;
  finalVariancePercent: number;
  severity: Severity;
};

type AnalyticsContext = {
  plans: Array<
    Prisma.StockTakePlanGetPayload<{
      include: {
        warehouse: true;
        sites: { include: { site: true } };
        locations: { include: { location: true } };
        countSubmissions: true;
        firstCountUser: true;
        secondCountUser: true;
      };
    }>
  >;
  entries: Array<
    Prisma.CountEntryGetPayload<{
      include: {
        countedByUser: true;
        location: { include: { site: true; warehouse: true } };
        item: { include: { uoms: true } };
        itemUom: true;
      };
    }>
  >;
  snapshots: Array<
    Prisma.StockSnapshotGetPayload<{
      include: {
        location: { include: { site: true; warehouse: true } };
        item: { include: { uoms: true } };
        itemUom: true;
      };
    }>
  >;
  syncQueues: Array<
    Prisma.SyncQueueGetPayload<{
      include: { plan: true };
    }>
  >;
  syncConflicts: Array<
    Prisma.SyncConflictGetPayload<{
      include: { plan: true };
    }>
  >;
  importJobs: Array<
    Prisma.ImportJobGetPayload<{
      include: {
        details: {
          take: 3;
          orderBy: { createdAt: "desc" };
        };
      };
    }>
  >;
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getOperationalSummary(query: QueryAnalyticsDto, actor?: CurrentUserPayload) {
    const context = await this.loadContext(query, actor);
    const varianceRows = this.buildVarianceRows(context, query);
    const countedLocationKeys = new Set(
      context.entries.map((entry) => `${entry.planId}:${entry.locationId}`),
    );
    const totalLocationsScheduled = context.plans.reduce(
      (sum, plan) => sum + plan.locations.length,
      0,
    );
    const totalLocationsCounted = countedLocationKeys.size;

    const payload = {
      kpis: {
        totalPlans: context.plans.length,
        draftPlans: context.plans.filter((plan) => plan.status === "Draft").length,
        scheduledPlans: context.plans.filter((plan) => plan.status === "Scheduled").length,
        inProgressPlans: context.plans.filter((plan) => plan.status === "In Progress").length,
        completedPlans: context.plans.filter((plan) => plan.status === "Completed").length,
        lockedPlans: context.plans.filter((plan) => plan.locked).length,
        firstCountsPending: context.plans.filter((plan) => !this.isSubmitted(plan, CountType.FIRST))
          .length,
        secondCountsPending: context.plans.filter(
          (plan) => this.isSubmitted(plan, CountType.FIRST) && !this.isSubmitted(plan, CountType.SECOND),
        ).length,
        locationsScheduled: totalLocationsScheduled,
        locationsCounted: totalLocationsCounted,
        locationsPending: Math.max(totalLocationsScheduled - totalLocationsCounted, 0),
      },
      statusBreakdown: [
        { label: "Draft", value: context.plans.filter((plan) => plan.status === "Draft").length },
        {
          label: "Scheduled",
          value: context.plans.filter((plan) => plan.status === "Scheduled").length,
        },
        {
          label: "In Progress",
          value: context.plans.filter((plan) => plan.status === "In Progress").length,
        },
        {
          label: "Completed",
          value: context.plans.filter((plan) => plan.status === "Completed").length,
        },
      ],
      activePlans: context.plans.slice(0, 8).map((plan) => {
        const planCountedLocations = new Set(
          context.entries
            .filter((entry) => entry.planId === plan.id)
            .map((entry) => `${entry.planId}:${entry.locationId}`),
        );

        return {
          planId: plan.id,
          planCode: plan.code,
          planName: plan.name,
          warehouseName: plan.warehouse.name,
          scheduledDate: plan.scheduledDate.toISOString(),
          status: plan.status,
          firstSubmitted: this.isSubmitted(plan, CountType.FIRST),
          secondSubmitted: this.isSubmitted(plan, CountType.SECOND),
          locationsScheduled: plan.locations.length,
          locationsCounted: planCountedLocations.size,
          completionPercent: this.percent(planCountedLocations.size, plan.locations.length),
        };
      }),
      firstSecondGaps: context.plans
        .filter((plan) => this.isSubmitted(plan, CountType.FIRST) && !this.isSubmitted(plan, CountType.SECOND))
        .map((plan) => ({
          planId: plan.id,
          planCode: plan.code,
          warehouseName: plan.warehouse.name,
          firstCountUser: plan.firstCountUser.name,
          secondCountUser: plan.secondCountUser.name,
          locationsRemaining: plan.locations.length,
        })),
      exceptions: [
        {
          title: "High variance items",
          value: varianceRows.filter((row) => row.severity === "high").length,
          tone: "danger",
        },
        {
          title: "Unresolved sync conflicts",
          value: context.syncConflicts.filter((item) => item.status !== ConflictStatus.RESOLVED).length,
          tone: "warning",
        },
        {
          title: "Failed import jobs",
          value: context.importJobs.filter((job) => job.status === "FAILED").length,
          tone: "danger",
        },
      ],
    };

    await this.logAnalyticsAccess("OPERATIONAL_SUMMARY", payload.kpis, actor);
    return payload;
  }

  async getManagementSummary(query: QueryAnalyticsDto, actor?: CurrentUserPayload) {
    const context = await this.loadContext(query, actor);
    const varianceRows = this.buildVarianceRows(context, query);
    const warehouseProgress = this.buildWarehouseProgressRows(context, varianceRows);
    const unresolvedConflicts = context.syncConflicts.filter(
      (item) => item.status !== ConflictStatus.RESOLVED,
    ).length;
    const failedImports = context.importJobs.filter((job) => job.status === "FAILED").length;
    const locationsScheduled = warehouseProgress.reduce((sum, row) => sum + row.locationsScheduled, 0);
    const locationsCounted = warehouseProgress.reduce((sum, row) => sum + row.locationsCounted, 0);

    const payload = {
      kpis: {
        networkCompletionRate: this.percent(locationsCounted, locationsScheduled),
        activePlans: context.plans.filter((plan) => plan.status !== "Completed").length,
        completedPlans: context.plans.filter((plan) => plan.status === "Completed").length,
        unresolvedConflicts,
        openVarianceItems: varianceRows.filter((row) => row.severity !== "matched").length,
        failedImports,
      },
      warehouseComparison: warehouseProgress,
      varianceSeverity: [
        { label: "Matched", value: varianceRows.filter((row) => row.severity === "matched").length },
        { label: "Low", value: varianceRows.filter((row) => row.severity === "low").length },
        { label: "Medium", value: varianceRows.filter((row) => row.severity === "medium").length },
        { label: "High", value: varianceRows.filter((row) => row.severity === "high").length },
      ],
      topIssues: [
        ...varianceRows
          .filter((row) => row.severity === "high")
          .slice(0, 4)
          .map((row, index) => ({
            id: `variance-${index}`,
            title: `${row.itemCode} variance at ${row.locationCode}`,
            description: `${row.warehouseName} · ${row.siteCode} · Final variance ${row.finalVarianceQty.toFixed(2)} ${row.uomCode}`,
            severity: "high",
            metric: `${row.finalVariancePercent.toFixed(1)}%`,
          })),
        ...context.syncConflicts
          .filter((item) => item.status !== ConflictStatus.RESOLVED)
          .slice(0, 2)
          .map((item, index) => ({
            id: `conflict-${index}`,
            title: `${item.conflictType.replace(/_/g, " ")} conflict`,
            description: `Plan ${item.plan.code} is waiting for controlled conflict resolution.`,
            severity: "medium",
            metric: "Sync review",
          })),
      ].slice(0, 6),
    };

    await this.logAnalyticsAccess("MANAGEMENT_SUMMARY", payload.kpis, actor);
    return payload;
  }

  async getWarehouseProgress(query: QueryAnalyticsDto, actor?: CurrentUserPayload) {
    const context = await this.loadContext(query, actor);
    const varianceRows = this.buildVarianceRows(context, query);
    const rows = this.buildWarehouseProgressRows(context, varianceRows);
    await this.logAnalyticsAccess("WAREHOUSE_PROGRESS", { rowCount: rows.length }, actor);
    return { rows };
  }

  async getSiteProgress(query: QueryAnalyticsDto, actor?: CurrentUserPayload) {
    const context = await this.loadContext(query, actor);
    const varianceRows = this.buildVarianceRows(context, query);
    const siteMap = new Map<
      string,
      {
        siteId: string;
        siteCode: string;
        siteName: string;
        warehouseName: string;
        locationsScheduled: number;
        countedLocationKeys: Set<string>;
        plansInScope: Set<string>;
        highVarianceCount: number;
      }
    >();

    for (const plan of context.plans) {
      for (const planSite of plan.sites) {
        const current =
          siteMap.get(planSite.siteId) ??
          {
            siteId: planSite.siteId,
            siteCode: planSite.site.code,
            siteName: planSite.site.name,
            warehouseName: plan.warehouse.name,
            locationsScheduled: 0,
            countedLocationKeys: new Set<string>(),
            plansInScope: new Set<string>(),
            highVarianceCount: 0,
          };

        current.plansInScope.add(plan.id);
        current.locationsScheduled += plan.locations.filter(
          (location) => location.location.siteId === planSite.siteId,
        ).length;
        siteMap.set(planSite.siteId, current);
      }
    }

    for (const entry of context.entries) {
      const site = siteMap.get(entry.siteId);
      if (site) {
        site.countedLocationKeys.add(`${entry.planId}:${entry.locationId}`);
      }
    }

    for (const row of varianceRows.filter((item) => item.severity === "high")) {
      const site = siteMap.get(row.siteId);
      if (site) {
        site.highVarianceCount += 1;
      }
    }

    const rows = Array.from(siteMap.values()).map((site) => ({
      siteId: site.siteId,
      siteCode: site.siteCode,
      siteName: site.siteName,
      warehouseName: site.warehouseName,
      plansInScope: site.plansInScope.size,
      locationsScheduled: site.locationsScheduled,
      locationsCounted: site.countedLocationKeys.size,
      locationsPending: Math.max(site.locationsScheduled - site.countedLocationKeys.size, 0),
      completionPercent: this.percent(site.countedLocationKeys.size, site.locationsScheduled),
      highVarianceCount: site.highVarianceCount,
    }));

    await this.logAnalyticsAccess("SITE_PROGRESS", { rowCount: rows.length }, actor);
    return { rows };
  }

  async getVarianceHotspots(query: QueryAnalyticsDto, actor?: CurrentUserPayload) {
    const context = await this.loadContext(query, actor);
    const rows = this.buildVarianceRows(context, query);

    const payload = {
      summary: {
        totalItemsCompared: rows.length,
        mismatchedItems: rows.filter((row) => row.severity !== "matched").length,
        matchedItems: rows.filter((row) => row.severity === "matched").length,
        highVarianceCount: rows.filter((row) => row.severity === "high").length,
        mediumVarianceCount: rows.filter((row) => row.severity === "medium").length,
        lowVarianceCount: rows.filter((row) => row.severity === "low").length,
      },
      severityDistribution: [
        { label: "Matched", value: rows.filter((row) => row.severity === "matched").length },
        { label: "Low", value: rows.filter((row) => row.severity === "low").length },
        { label: "Medium", value: rows.filter((row) => row.severity === "medium").length },
        { label: "High", value: rows.filter((row) => row.severity === "high").length },
      ],
      topItems: this.aggregateHotspots(rows, (row) => row.itemCode, (row) => ({
        itemCode: row.itemCode,
        itemDescription: row.itemDescription,
      })),
      topLocations: this.aggregateHotspots(rows, (row) => row.locationId, (row) => ({
        locationId: row.locationId,
        locationCode: row.locationCode,
        siteCode: row.siteCode,
      })),
      topSites: this.aggregateHotspots(rows, (row) => row.siteId, (row) => ({
        siteId: row.siteId,
        siteCode: row.siteCode,
        warehouseName: row.warehouseName,
      })),
      topWarehouses: this.aggregateHotspots(rows, (row) => row.warehouseId, (row) => ({
        warehouseId: row.warehouseId,
        warehouseName: row.warehouseName,
      })),
    };

    await this.logAnalyticsAccess("VARIANCE_HOTSPOTS", payload.summary, actor);
    return payload;
  }

  async getProductivity(query: QueryAnalyticsDto, actor?: CurrentUserPayload) {
    const context = await this.loadContext(query, actor);
    const userMap = new Map<
      string,
      {
        userId: string;
        userName: string;
        countsPerformed: number;
        countsSubmitted: number;
        firstCountLines: number;
        secondCountLines: number;
        latestCountAt: string | null;
      }
    >();

    for (const entry of context.entries) {
      const current =
        userMap.get(entry.countedByUserId) ??
        {
          userId: entry.countedByUserId,
          userName: entry.countedByUser.name,
          countsPerformed: 0,
          countsSubmitted: 0,
          firstCountLines: 0,
          secondCountLines: 0,
          latestCountAt: null,
        };

      current.countsPerformed += 1;
      if (entry.countType === CountType.FIRST) current.firstCountLines += 1;
      if (entry.countType === CountType.SECOND) current.secondCountLines += 1;
      current.latestCountAt =
        !current.latestCountAt || current.latestCountAt < entry.countedAt.toISOString()
          ? entry.countedAt.toISOString()
          : current.latestCountAt;
      userMap.set(entry.countedByUserId, current);
    }

    for (const plan of context.plans) {
      for (const submission of plan.countSubmissions.filter(
        (item) => item.status === SubmissionStatus.SUBMITTED && item.submittedByUserId,
      )) {
        const userId = submission.submittedByUserId as string;
        const userName =
          userId === plan.firstCountUserId ? plan.firstCountUser.name : plan.secondCountUser.name;
        const current =
          userMap.get(userId) ??
          {
            userId,
            userName,
            countsPerformed: 0,
            countsSubmitted: 0,
            firstCountLines: 0,
            secondCountLines: 0,
            latestCountAt: null,
          };
        current.countsSubmitted += 1;
        userMap.set(userId, current);
      }
    }

    const pendingWorkload = this.buildPendingWorkload(context);
    const averageCompletionHours = this.buildAverageCompletionHours(context);
    const users = Array.from(userMap.values()).sort(
      (left, right) => right.countsPerformed - left.countsPerformed,
    );

    const payload = {
      summary: {
        countsPerformed: context.entries.length,
        countsSubmitted: context.plans.reduce(
          (sum, plan) =>
            sum +
            plan.countSubmissions.filter((item) => item.status === SubmissionStatus.SUBMITTED).length,
          0,
        ),
        firstCountThroughput: context.entries.filter((entry) => entry.countType === CountType.FIRST).length,
        secondCountThroughput: context.entries.filter((entry) => entry.countType === CountType.SECOND).length,
        averageCompletionHours,
      },
      users: users.slice(0, 10),
      pendingWorkload,
    };

    await this.logAnalyticsAccess("PRODUCTIVITY", payload.summary, actor);
    return payload;
  }

  async getSyncHealth(query: QueryAnalyticsDto, actor?: CurrentUserPayload) {
    const context = await this.loadContext(query, actor);
    const unresolved = context.syncConflicts.filter(
      (item) => item.status !== ConflictStatus.RESOLVED,
    );
    const conflictTypeMap = new Map<string, number>();
    const conflictTrend = new Map<string, { label: string; open: number; resolved: number }>();

    for (const conflict of context.syncConflicts) {
      conflictTypeMap.set(
        conflict.conflictType,
        (conflictTypeMap.get(conflict.conflictType) ?? 0) + 1,
      );

      const label = conflict.createdAt.toISOString().slice(0, 10);
      const row = conflictTrend.get(label) ?? { label, open: 0, resolved: 0 };
      if (conflict.status === ConflictStatus.RESOLVED) {
        row.resolved += 1;
      } else {
        row.open += 1;
      }
      conflictTrend.set(label, row);
    }

    const payload = {
      summary: {
        pendingQueueItems: context.syncQueues.filter((item) => item.syncStatus === "PENDING").length,
        failedSyncs: context.syncQueues.filter((item) => item.syncStatus === "FAILED").length,
        unresolvedConflicts: unresolved.length,
        resolvedConflicts: context.syncConflicts.filter((item) => item.status === ConflictStatus.RESOLVED).length,
        averageConflictAgeHours: unresolved.length
          ? Number(
              (
                unresolved.reduce(
                  (sum, item) => sum + (Date.now() - item.createdAt.getTime()) / 36e5,
                  0,
                ) / unresolved.length
              ).toFixed(1),
            )
          : 0,
      },
      conflictTypes: Array.from(conflictTypeMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((left, right) => right.value - left.value),
      conflictTrend: Array.from(conflictTrend.values()).sort((left, right) =>
        left.label.localeCompare(right.label),
      ),
      recentQueue: context.syncQueues.slice(0, 8).map((item) => ({
        id: item.id,
        planCode: item.plan.code,
        actionType: item.actionType,
        syncStatus: item.syncStatus,
        createdAt: item.createdAt.toISOString(),
        errorMessage: item.errorMessage,
      })),
    };

    await this.logAnalyticsAccess("SYNC_HEALTH", payload.summary, actor);
    return payload;
  }

  async getIntegrationHealth(query: QueryAnalyticsDto, actor?: CurrentUserPayload) {
    const context = await this.loadContext(query, actor);
    const stockSnapshotImport = context.importJobs.find(
      (job) => job.importType === "STOCK_SNAPSHOT",
    );
    const masterRefresh = context.importJobs.find(
      (job) => job.importType !== "STOCK_SNAPSHOT",
    );
    const importTypeMap = new Map<string, { success: number; failed: number; partial: number }>();

    for (const job of context.importJobs) {
      const row = importTypeMap.get(job.importType) ?? { success: 0, failed: 0, partial: 0 };
      if (job.status === "SUCCESS") row.success += 1;
      if (job.status === "FAILED") row.failed += 1;
      if (job.status === "PARTIAL_SUCCESS") row.partial += 1;
      importTypeMap.set(job.importType, row);
    }

    const payload = {
      summary: {
        successfulJobs: context.importJobs.filter((job) => job.status === "SUCCESS").length,
        partialFailureJobs: context.importJobs.filter((job) => job.status === "PARTIAL_SUCCESS").length,
        failedJobs: context.importJobs.filter((job) => job.status === "FAILED").length,
        latestStockSnapshotImport: stockSnapshotImport?.completedAt?.toISOString() ?? null,
        latestMasterRefresh: masterRefresh?.completedAt?.toISOString() ?? null,
      },
      importTypes: Array.from(importTypeMap.entries()).map(([label, counts]) => ({
        label,
        ...counts,
      })),
      recentJobs: context.importJobs.slice(0, 10).map((job) => ({
        id: job.id,
        importType: job.importType,
        status: job.status,
        sourceSystem: job.sourceSystem,
        totalRecords: job.totalRecords,
        insertedCount: job.insertedCount,
        updatedCount: job.updatedCount,
        failedCount: job.failedCount,
        startedAt: job.startedAt.toISOString(),
        completedAt: job.completedAt?.toISOString() ?? null,
      })),
    };

    await this.logAnalyticsAccess("INTEGRATION_HEALTH", payload.summary, actor);
    return payload;
  }

  async getCompletionTrends(query: QueryAnalyticsDto, actor?: CurrentUserPayload) {
    const context = await this.loadContext(query, actor);
    const trendMap = new Map<
      string,
      {
        label: string;
        scheduledPlans: number;
        completedPlans: number;
        submittedCounts: number;
        countedLines: number;
      }
    >();

    for (const plan of context.plans) {
      const label = plan.scheduledDate.toISOString().slice(0, 10);
      const row = trendMap.get(label) ?? {
        label,
        scheduledPlans: 0,
        completedPlans: 0,
        submittedCounts: 0,
        countedLines: 0,
      };
      row.scheduledPlans += 1;
      if (plan.status === "Completed") {
        row.completedPlans += 1;
      }
      row.submittedCounts += plan.countSubmissions.filter(
        (submission) => submission.status === SubmissionStatus.SUBMITTED,
      ).length;
      trendMap.set(label, row);
    }

    for (const entry of context.entries) {
      const label = entry.countedAt.toISOString().slice(0, 10);
      const row = trendMap.get(label) ?? {
        label,
        scheduledPlans: 0,
        completedPlans: 0,
        submittedCounts: 0,
        countedLines: 0,
      };
      row.countedLines += 1;
      trendMap.set(label, row);
    }

    const points = Array.from(trendMap.values()).sort((left, right) =>
      left.label.localeCompare(right.label),
    );
    await this.logAnalyticsAccess("COMPLETION_TRENDS", { points: points.length }, actor);
    return { points };
  }

  private async loadContext(query: QueryAnalyticsDto, actor?: CurrentUserPayload): Promise<AnalyticsContext> {
    const planWhere = this.buildPlanWhere(query, actor);
    const plans = await this.prisma.stockTakePlan.findMany({
      where: planWhere,
      include: {
        warehouse: true,
        sites: { include: { site: true } },
        locations: { include: { location: true } },
        countSubmissions: true,
        firstCountUser: true,
        secondCountUser: true,
      },
      orderBy: [{ scheduledDate: "desc" }, { code: "asc" }],
    });

    const planIds = plans.map((plan) => plan.id);
    if (!planIds.length) {
      return {
        plans: [],
        entries: [],
        snapshots: [],
        syncQueues: [],
        syncConflicts: [],
        importJobs: [],
      };
    }

    const locationIds = Array.from(
      new Set(plans.flatMap((plan) => plan.locations.map((location) => location.locationId))),
    );
    const entriesWhere: Prisma.CountEntryWhereInput = {
      planId: { in: planIds },
      ...(query.siteId ? { siteId: query.siteId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.userId ? { countedByUserId: query.userId } : {}),
    };
    const snapshotsWhere: Prisma.StockSnapshotWhereInput = {
      locationId: { in: locationIds },
      ...(query.siteId ? { siteId: query.siteId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
    };

    const syncQueueWhere: Prisma.SyncQueueWhereInput = {
      planId: { in: planIds },
      ...(actor?.role === ROLE_CODES.WAREHOUSE_USER ? { userId: actor.sub } : {}),
    };
    const syncConflictWhere: Prisma.SyncConflictWhereInput = {
      planId: { in: planIds },
      ...(actor?.role === ROLE_CODES.WAREHOUSE_USER
        ? {
            syncQueue: {
              is: {
                userId: actor.sub,
              },
            },
          }
        : {}),
    };

    const [entries, snapshots, syncQueues, syncConflicts, importJobs] = await Promise.all([
      this.prisma.countEntry.findMany({
        where: entriesWhere,
        include: {
          countedByUser: true,
          location: { include: { site: true, warehouse: true } },
          item: { include: { uoms: true } },
          itemUom: true,
        },
      }),
      this.prisma.stockSnapshot.findMany({
        where: snapshotsWhere,
        include: {
          location: { include: { site: true, warehouse: true } },
          item: { include: { uoms: true } },
          itemUom: true,
        },
      }),
      this.prisma.syncQueue.findMany({
        where: syncQueueWhere,
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.syncConflict.findMany({
        where: syncConflictWhere,
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.importJob.findMany({
        include: {
          details: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: { startedAt: "desc" },
        take: 25,
      }),
    ]);

    return {
      plans,
      entries,
      snapshots,
      syncQueues,
      syncConflicts,
      importJobs,
    };
  }

  private buildPlanWhere(query: QueryAnalyticsDto, actor?: CurrentUserPayload): Prisma.StockTakePlanWhereInput {
    const dateFilters =
      query.dateFrom || query.dateTo
        ? {
            scheduledDate: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(`${query.dateTo}T23:59:59.999Z`) } : {}),
            },
          }
        : {};

    const where: Prisma.StockTakePlanWhereInput = {
      ...(query.planId ? { id: query.planId } : {}),
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.siteId ? { sites: { some: { siteId: query.siteId } } } : {}),
      ...(query.locationId ? { locations: { some: { locationId: query.locationId } } } : {}),
      ...dateFilters,
    };

    if (!actor) {
      return where;
    }

    if (actor.role === ROLE_CODES.WAREHOUSE_USER) {
      return {
        AND: [
          where,
          {
            warehouseId: { in: actor.warehouseIds.length ? actor.warehouseIds : ["__none__"] },
            OR: [{ firstCountUserId: actor.sub }, { secondCountUserId: actor.sub }],
          },
        ],
      };
    }

    if (actor.role === ROLE_CODES.AUDITOR && actor.warehouseIds.length) {
      return {
        AND: [where, { warehouseId: { in: actor.warehouseIds } }],
      };
    }

    return where;
  }

  private buildVarianceRows(context: AnalyticsContext, query: QueryAnalyticsDto) {
    const itemFilter = query.itemId?.trim().toLowerCase();
    const itemAllowed = (row: { itemId: string; itemCode: string; itemDescription: string }) =>
      !itemFilter ||
      row.itemId === query.itemId ||
      row.itemCode.toLowerCase().includes(itemFilter) ||
      row.itemDescription.toLowerCase().includes(itemFilter);

    const rowMap = new Map<string, VarianceRow>();
    const planMap = new Map(context.plans.map((plan) => [plan.id, plan]));

    for (const snapshot of context.snapshots) {
      const item = snapshot.item;
      const baseUom = item.uoms.find((uom) => uom.isBase) ?? item.uoms[0];
      const convertedQty =
        (Number(snapshot.quantity) * Number(snapshot.itemUom.conversionFactor)) /
        Number(baseUom.conversionFactor);
      const applicablePlans = context.plans.filter((candidate) =>
        candidate.locations.some((location) => location.locationId === snapshot.locationId),
      );

      for (const plan of applicablePlans) {
        const key = `${plan.id}:${snapshot.locationId}:${snapshot.itemId}`;
        const current =
          rowMap.get(key) ??
          {
            planId: plan.id,
            planCode: plan.code,
            warehouseId: snapshot.location.warehouse.id,
            warehouseName: snapshot.location.warehouse.name,
            siteId: snapshot.location.site.id,
            siteCode: snapshot.location.site.code,
            locationId: snapshot.location.id,
            locationCode: snapshot.location.code,
            itemId: item.id,
            itemCode: item.code,
            itemDescription: item.description,
            uomCode: baseUom.uomCode,
            systemQty: 0,
            firstQty: 0,
            secondQty: 0,
            firstVarianceQty: 0,
            secondVarianceQty: 0,
            betweenCountsQty: 0,
            finalVarianceQty: 0,
            firstVariancePercent: 0,
            secondVariancePercent: 0,
            betweenCountsPercent: 0,
            finalVariancePercent: 0,
            severity: "matched" as Severity,
          };
        current.systemQty += convertedQty;
        rowMap.set(key, current);
      }
    }

    for (const entry of context.entries) {
      const item = entry.item;
      const baseUom = item.uoms.find((uom) => uom.isBase) ?? item.uoms[0];
      const convertedQty =
        (Number(entry.countedQty) * Number(entry.itemUom.conversionFactor)) /
        Number(baseUom.conversionFactor);
      const key = `${entry.planId}:${entry.locationId}:${entry.itemId}`;
      const plan = planMap.get(entry.planId);

      if (!plan) continue;
      if (entry.countType === CountType.FIRST && !this.isSubmitted(plan, CountType.FIRST)) continue;
      if (entry.countType === CountType.SECOND && !this.isSubmitted(plan, CountType.SECOND)) continue;

      const current =
        rowMap.get(key) ??
        {
          planId: plan.id,
          planCode: plan.code,
          warehouseId: entry.location.warehouse.id,
          warehouseName: entry.location.warehouse.name,
          siteId: entry.location.site.id,
          siteCode: entry.location.site.code,
          locationId: entry.location.id,
          locationCode: entry.location.code,
          itemId: item.id,
          itemCode: item.code,
          itemDescription: item.description,
          uomCode: baseUom.uomCode,
          systemQty: 0,
          firstQty: 0,
          secondQty: 0,
          firstVarianceQty: 0,
          secondVarianceQty: 0,
          betweenCountsQty: 0,
          finalVarianceQty: 0,
          firstVariancePercent: 0,
          secondVariancePercent: 0,
          betweenCountsPercent: 0,
          finalVariancePercent: 0,
          severity: "matched" as Severity,
        };

      if (entry.countType === CountType.FIRST) current.firstQty += convertedQty;
      if (entry.countType === CountType.SECOND) current.secondQty += convertedQty;
      rowMap.set(key, current);
    }

    return Array.from(rowMap.values())
      .map((row) => {
        row.firstVarianceQty = row.firstQty - row.systemQty;
        row.secondVarianceQty = row.secondQty - row.systemQty;
        row.betweenCountsQty = row.secondQty - row.firstQty;
        row.finalVarianceQty = (row.secondQty || row.firstQty) - row.systemQty;
        row.firstVariancePercent = this.percent(row.firstVarianceQty, row.systemQty);
        row.secondVariancePercent = this.percent(row.secondVarianceQty, row.systemQty);
        row.betweenCountsPercent = this.percent(row.betweenCountsQty, row.firstQty);
        row.finalVariancePercent = this.percent(row.finalVarianceQty, row.systemQty);
        row.severity = this.getSeverity(Math.abs(row.finalVariancePercent));
        return row;
      })
      .filter(itemAllowed)
      .filter((row) => !query.severity || row.severity === query.severity);
  }

  private buildWarehouseProgressRows(context: AnalyticsContext, varianceRows: VarianceRow[]) {
    const progressMap = new Map<
      string,
      {
        warehouseId: string;
        warehouseName: string;
        plansInScope: number;
        locationsScheduled: number;
        countedLocationKeys: Set<string>;
        firstCountsPending: number;
        secondCountsPending: number;
        highVarianceCount: number;
        unresolvedConflicts: number;
      }
    >();

    for (const plan of context.plans) {
      const current =
        progressMap.get(plan.warehouseId) ??
        {
          warehouseId: plan.warehouseId,
          warehouseName: plan.warehouse.name,
          plansInScope: 0,
          locationsScheduled: 0,
          countedLocationKeys: new Set<string>(),
          firstCountsPending: 0,
          secondCountsPending: 0,
          highVarianceCount: 0,
          unresolvedConflicts: 0,
        };
      current.plansInScope += 1;
      current.locationsScheduled += plan.locations.length;
      if (!this.isSubmitted(plan, CountType.FIRST)) current.firstCountsPending += 1;
      if (this.isSubmitted(plan, CountType.FIRST) && !this.isSubmitted(plan, CountType.SECOND)) {
        current.secondCountsPending += 1;
      }
      progressMap.set(plan.warehouseId, current);
    }

    for (const entry of context.entries) {
      const current = progressMap.get(entry.warehouseId);
      if (current) {
        current.countedLocationKeys.add(`${entry.planId}:${entry.locationId}`);
      }
    }

    for (const row of varianceRows.filter((item) => item.severity === "high")) {
      const current = progressMap.get(row.warehouseId);
      if (current) current.highVarianceCount += 1;
    }

    for (const conflict of context.syncConflicts.filter((item) => item.status !== ConflictStatus.RESOLVED)) {
      const plan = context.plans.find((item) => item.id === conflict.planId);
      if (!plan) continue;
      const current = progressMap.get(plan.warehouseId);
      if (current) current.unresolvedConflicts += 1;
    }

    return Array.from(progressMap.values()).map((row) => ({
      warehouseId: row.warehouseId,
      warehouseName: row.warehouseName,
      plansInScope: row.plansInScope,
      locationsScheduled: row.locationsScheduled,
      locationsCounted: row.countedLocationKeys.size,
      locationsPending: Math.max(row.locationsScheduled - row.countedLocationKeys.size, 0),
      completionPercent: this.percent(row.countedLocationKeys.size, row.locationsScheduled),
      firstCountsPending: row.firstCountsPending,
      secondCountsPending: row.secondCountsPending,
      highVarianceCount: row.highVarianceCount,
      unresolvedConflicts: row.unresolvedConflicts,
    }));
  }

  private buildPendingWorkload(context: AnalyticsContext) {
    const workload = new Map<
      string,
      {
        userId: string;
        userName: string;
        countType: CountType;
        assignedPlans: number;
        locationsScheduled: number;
        locationsCounted: number;
        locationsPending: number;
      }
    >();

    for (const plan of context.plans) {
      const assignments = [
        {
          userId: plan.firstCountUserId,
          userName: plan.firstCountUser.name,
          countType: CountType.FIRST,
        },
        {
          userId: plan.secondCountUserId,
          userName: plan.secondCountUser.name,
          countType: CountType.SECOND,
        },
      ];

      for (const assignment of assignments) {
        const key = `${assignment.userId}:${assignment.countType}`;
        const countedLocations = new Set(
          context.entries
            .filter(
              (entry) =>
                entry.planId === plan.id &&
                entry.countType === assignment.countType &&
                entry.countedByUserId === assignment.userId,
            )
            .map((entry) => entry.locationId),
        );
        const current =
          workload.get(key) ??
          {
            userId: assignment.userId,
            userName: assignment.userName,
            countType: assignment.countType,
            assignedPlans: 0,
            locationsScheduled: 0,
            locationsCounted: 0,
            locationsPending: 0,
          };
        current.assignedPlans += 1;
        current.locationsScheduled += plan.locations.length;
        current.locationsCounted += countedLocations.size;
        current.locationsPending += Math.max(plan.locations.length - countedLocations.size, 0);
        workload.set(key, current);
      }
    }

    return Array.from(workload.values()).sort(
      (left, right) => right.locationsPending - left.locationsPending,
    );
  }

  private buildAverageCompletionHours(context: AnalyticsContext) {
    const durations: number[] = [];
    for (const plan of context.plans) {
      for (const submission of plan.countSubmissions.filter(
        (item) => item.status === SubmissionStatus.SUBMITTED && item.submittedAt,
      )) {
        const earliestEntry = context.entries
          .filter((entry) => entry.planId === plan.id && entry.countType === submission.countType)
          .sort((left, right) => left.countedAt.getTime() - right.countedAt.getTime())[0];

        if (earliestEntry && submission.submittedAt) {
          durations.push((submission.submittedAt.getTime() - earliestEntry.countedAt.getTime()) / 36e5);
        }
      }
    }

    if (!durations.length) return 0;
    return Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(1));
  }

  private aggregateHotspots(
    rows: VarianceRow[],
    keyFn: (row: VarianceRow) => string,
    baseFn: (row: VarianceRow) => Record<string, string>,
  ) {
    const map = new Map<string, Record<string, string | number>>();
    for (const row of rows.filter((item) => item.severity !== "matched")) {
      const key = keyFn(row);
      const current = map.get(key) ?? {
        ...baseFn(row),
        mismatchCount: 0,
        totalVarianceQty: 0,
      };
      current.mismatchCount = Number(current.mismatchCount) + 1;
      current.totalVarianceQty = Number(current.totalVarianceQty) + Math.abs(row.finalVarianceQty);
      map.set(key, current);
    }

    return Array.from(map.values())
      .sort((left, right) => Number(right.totalVarianceQty) - Number(left.totalVarianceQty))
      .slice(0, 10);
  }

  private isSubmitted(
    plan: {
      countSubmissions: Array<{ countType: CountType; status: SubmissionStatus }>;
    },
    countType: CountType,
  ) {
    return (
      plan.countSubmissions.find((item) => item.countType === countType)?.status ===
      SubmissionStatus.SUBMITTED
    );
  }

  private getSeverity(percent: number): Severity {
    if (percent === 0) return "matched";
    if (percent >= 10) return "high";
    if (percent >= 5) return "medium";
    return "low";
  }

  private percent(value: number, baseline: number) {
    if (!baseline) return value === 0 ? 0 : 100;
    return Number(((value / baseline) * 100).toFixed(1));
  }

  private async logAnalyticsAccess(action: string, metadata: Record<string, unknown>, actor?: CurrentUserPayload) {
    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action,
      entityType: "ANALYTICS",
      metadata,
    });
  }
}
