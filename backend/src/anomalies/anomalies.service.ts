import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AnomalySeverity,
  AnomalyStatus,
  AnomalyType,
  ConflictStatus,
  CountType,
  Prisma,
  SubmissionStatus,
} from "@prisma/client";
import { AuditLogService } from "src/audit-log/audit-log.service";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { QueryAnomaliesDto } from "./dto/query-anomalies.dto";
import { ReviewAnomalyDto } from "./dto/review-anomaly.dto";
import { RunAnomaliesDto } from "./dto/run-anomalies.dto";

type DetectedAnomalyInput = {
  fingerprint: string;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  planId?: string | null;
  warehouseId?: string | null;
  siteId?: string | null;
  locationId?: string | null;
  itemId?: string | null;
  userId?: string | null;
  relatedCountEntryId?: string | null;
  summary: string;
  details: Prisma.InputJsonValue;
};

@Injectable()
export class AnomaliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async list(query: QueryAnomaliesDto, actor?: CurrentUserPayload) {
    const where = this.buildWhere(query, actor);
    const anomalies = await this.prisma.anomaly.findMany({
      where,
      include: {
        plan: true,
        warehouse: true,
        site: true,
        location: true,
        item: true,
        user: true,
        reviewedBy: true,
      },
      orderBy: [{ status: "asc" }, { detectedAt: "desc" }],
      take: 200,
    });

    return anomalies.map((anomaly) => ({
      id: anomaly.id,
      anomalyType: anomaly.anomalyType,
      severity: anomaly.severity,
      status: anomaly.status,
      summary: anomaly.summary,
      planId: anomaly.planId,
      planCode: anomaly.plan?.code ?? null,
      warehouseName: anomaly.warehouse?.name ?? null,
      siteCode: anomaly.site?.code ?? null,
      locationCode: anomaly.location?.code ?? null,
      itemCode: anomaly.item?.code ?? null,
      userName: anomaly.user?.name ?? null,
      detectedAt: anomaly.detectedAt.toISOString(),
      reviewedAt: anomaly.reviewedAt?.toISOString() ?? null,
      reviewedByName: anomaly.reviewedBy?.name ?? null,
    }));
  }

  async detail(id: string, actor?: CurrentUserPayload) {
    const anomaly = await this.prisma.anomaly.findUnique({
      where: { id },
      include: {
        plan: true,
        warehouse: true,
        site: true,
        location: true,
        item: true,
        user: true,
        relatedCountEntry: {
          include: {
            itemUom: true,
            countedByUser: true,
          },
        },
        reviewedBy: true,
      },
    });

    if (!anomaly) {
      throw new NotFoundException("Anomaly not found");
    }

    this.assertAccess(anomaly.warehouseId, actor);

    return {
      id: anomaly.id,
      anomalyType: anomaly.anomalyType,
      severity: anomaly.severity,
      status: anomaly.status,
      summary: anomaly.summary,
      details: anomaly.details,
      notes: anomaly.notes,
      detectedAt: anomaly.detectedAt.toISOString(),
      reviewedAt: anomaly.reviewedAt?.toISOString() ?? null,
      reviewedByName: anomaly.reviewedBy?.name ?? null,
      context: {
        planId: anomaly.planId,
        planCode: anomaly.plan?.code ?? null,
        planName: anomaly.plan?.name ?? null,
        warehouseName: anomaly.warehouse?.name ?? null,
        siteCode: anomaly.site?.code ?? null,
        locationCode: anomaly.location?.code ?? null,
        itemCode: anomaly.item?.code ?? null,
        itemDescription: anomaly.item?.description ?? null,
        userName: anomaly.user?.name ?? null,
      },
      relatedCountEntry: anomaly.relatedCountEntry
        ? {
            id: anomaly.relatedCountEntry.id,
            countType: anomaly.relatedCountEntry.countType,
            countedQty: Number(anomaly.relatedCountEntry.countedQty),
            countedAt: anomaly.relatedCountEntry.countedAt.toISOString(),
            uomCode: anomaly.relatedCountEntry.itemUom.uomCode,
            countedByName: anomaly.relatedCountEntry.countedByUser.name,
          }
        : null,
    };
  }

  async summary(query: QueryAnomaliesDto, actor?: CurrentUserPayload) {
    const where = this.buildWhere(query, actor);
    const [counts, recent, topOpen] = await Promise.all([
      this.prisma.anomaly.groupBy({
        by: ["severity", "status"],
        where,
        _count: { _all: true },
      }),
      this.prisma.anomaly.findMany({
        where,
        orderBy: { detectedAt: "desc" },
        take: 5,
        include: {
          plan: true,
          location: true,
          item: true,
        },
      }),
      this.prisma.anomaly.findMany({
        where: {
          ...where,
          status: { in: [AnomalyStatus.OPEN, AnomalyStatus.REVIEWED] },
        },
        orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
        take: 5,
        include: {
          plan: true,
          location: true,
          item: true,
        },
      }),
    ]);

    return {
      totalOpen: counts
        .filter((row) => row.status === AnomalyStatus.OPEN)
        .reduce((sum, row) => sum + row._count._all, 0),
      totalReviewed: counts
        .filter((row) => row.status === AnomalyStatus.REVIEWED)
        .reduce((sum, row) => sum + row._count._all, 0),
      totalClosed: counts
        .filter((row) => row.status === AnomalyStatus.CLOSED)
        .reduce((sum, row) => sum + row._count._all, 0),
      severityDistribution: [
        {
          label: "LOW",
          value: counts
            .filter((row) => row.severity === AnomalySeverity.LOW)
            .reduce((sum, row) => sum + row._count._all, 0),
        },
        {
          label: "MEDIUM",
          value: counts
            .filter((row) => row.severity === AnomalySeverity.MEDIUM)
            .reduce((sum, row) => sum + row._count._all, 0),
        },
        {
          label: "HIGH",
          value: counts
            .filter((row) => row.severity === AnomalySeverity.HIGH)
            .reduce((sum, row) => sum + row._count._all, 0),
        },
        {
          label: "CRITICAL",
          value: counts
            .filter((row) => row.severity === AnomalySeverity.CRITICAL)
            .reduce((sum, row) => sum + row._count._all, 0),
        },
      ],
      topOpen: topOpen.map((anomaly) => ({
        id: anomaly.id,
        summary: anomaly.summary,
        severity: anomaly.severity,
        anomalyType: anomaly.anomalyType,
        planCode: anomaly.plan?.code ?? null,
        locationCode: anomaly.location?.code ?? null,
        itemCode: anomaly.item?.code ?? null,
        detectedAt: anomaly.detectedAt.toISOString(),
      })),
      recent: recent.map((anomaly) => ({
        id: anomaly.id,
        summary: anomaly.summary,
        status: anomaly.status,
        severity: anomaly.severity,
        detectedAt: anomaly.detectedAt.toISOString(),
      })),
    };
  }

  async run(dto: RunAnomaliesDto, actor?: CurrentUserPayload) {
    const scopedPlans = await this.prisma.stockTakePlan.findMany({
      where: this.buildPlanScope(dto, actor),
      include: {
        warehouse: true,
        sites: { include: { site: true } },
        locations: { include: { location: true } },
        countSubmissions: true,
        firstCountUser: true,
        secondCountUser: true,
      },
    });

    const planIds = scopedPlans.map((plan) => plan.id);
    if (!planIds.length) {
      return { created: 0, updated: 0, closed: 0, totalDetected: 0 };
    }

    const locationIds = Array.from(
      new Set(scopedPlans.flatMap((plan) => plan.locations.map((location) => location.locationId))),
    );

    const [entries, snapshots, conflicts, importJobs] = await Promise.all([
      this.prisma.countEntry.findMany({
        where: { planId: { in: planIds } },
        include: {
          item: { include: { uoms: true } },
          itemUom: true,
          countedByUser: true,
          location: true,
        },
      }),
      this.prisma.stockSnapshot.findMany({
        where: { locationId: { in: locationIds } },
        include: {
          item: { include: { uoms: true } },
          itemUom: true,
          location: true,
        },
      }),
      this.prisma.syncConflict.findMany({
        where: { planId: { in: planIds } },
        include: {
          syncQueue: true,
        },
      }),
      this.prisma.importJob.findMany({
        orderBy: { completedAt: "desc" },
        take: 20,
      }),
    ]);

    const detected = this.detectAnomalies({
      plans: scopedPlans,
      entries,
      snapshots,
      conflicts,
      importJobs,
    });

    const existing = await this.prisma.anomaly.findMany({
      where: {
        OR: [
          { planId: { in: planIds } },
          dto.warehouseId ? { warehouseId: dto.warehouseId } : {},
        ],
      },
    });

    let created = 0;
    let updated = 0;

    for (const anomaly of detected) {
      const existingMatch = existing.find((item) => item.fingerprint === anomaly.fingerprint);
      await this.prisma.anomaly.upsert({
        where: { fingerprint: anomaly.fingerprint },
        create: {
          ...anomaly,
          status: AnomalyStatus.OPEN,
        },
        update: {
          anomalyType: anomaly.anomalyType,
          severity: anomaly.severity,
          planId: anomaly.planId ?? null,
          warehouseId: anomaly.warehouseId ?? null,
          siteId: anomaly.siteId ?? null,
          locationId: anomaly.locationId ?? null,
          itemId: anomaly.itemId ?? null,
          userId: anomaly.userId ?? null,
          relatedCountEntryId: anomaly.relatedCountEntryId ?? null,
          summary: anomaly.summary,
          details: anomaly.details,
          detectedAt: new Date(),
          status:
            existingMatch?.status === AnomalyStatus.CLOSED ? AnomalyStatus.OPEN : existingMatch?.status ?? AnomalyStatus.OPEN,
        },
      });
      if (existingMatch) {
        updated += 1;
      } else {
        created += 1;
      }
    }

    const detectedFingerprints = new Set(detected.map((item) => item.fingerprint));
    const stale = existing.filter(
      (item) =>
        !detectedFingerprints.has(item.fingerprint) &&
        item.status !== AnomalyStatus.CLOSED,
    );

    for (const anomaly of stale) {
      await this.prisma.anomaly.update({
        where: { id: anomaly.id },
        data: {
          status: AnomalyStatus.CLOSED,
          notes: anomaly.notes
            ? `${anomaly.notes}\nAuto-closed after anomaly rerun no longer found this condition.`
            : "Auto-closed after anomaly rerun no longer found this condition.",
          reviewedById: actor?.sub ?? null,
          reviewedAt: new Date(),
        },
      });
    }

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "ANOMALY_RUN_EXECUTED",
      entityType: "ANOMALY",
      metadata: {
        created,
        updated,
        closed: stale.length,
        planIds,
      },
    });

    return {
      created,
      updated,
      closed: stale.length,
      totalDetected: detected.length,
    };
  }

  async review(id: string, dto: ReviewAnomalyDto, actor?: CurrentUserPayload) {
    const anomaly = await this.prisma.anomaly.findUnique({
      where: { id },
    });

    if (!anomaly) {
      throw new NotFoundException("Anomaly not found");
    }

    this.assertAccess(anomaly.warehouseId, actor);

    const updated = await this.prisma.anomaly.update({
      where: { id },
      data: {
        status: dto.status as AnomalyStatus,
        notes: dto.notes ?? anomaly.notes,
        reviewedById: actor?.sub ?? null,
        reviewedAt: new Date(),
      },
    });

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "ANOMALY_REVIEWED",
      entityType: "ANOMALY",
      entityId: id,
      metadata: {
        status: dto.status,
      },
    });

    return {
      success: true,
      id: updated.id,
      status: updated.status,
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
    };
  }

  private detectAnomalies(input: {
    plans: Array<any>;
    entries: Array<any>;
    snapshots: Array<any>;
    conflicts: Array<any>;
    importJobs: Array<any>;
  }) {
    const anomalies: DetectedAnomalyInput[] = [];
    const planMap = new Map(input.plans.map((plan) => [plan.id, plan]));
    const snapshotMap = new Map<string, number>();

    for (const snapshot of input.snapshots) {
      const baseUom = snapshot.item.uoms.find((uom: any) => uom.isBase) ?? snapshot.item.uoms[0];
      const normalized =
        (Number(snapshot.quantity) * Number(snapshot.itemUom.conversionFactor)) /
        Number(baseUom.conversionFactor);
      const key = `${snapshot.locationId}:${snapshot.itemId}`;
      snapshotMap.set(key, (snapshotMap.get(key) ?? 0) + normalized);
    }

    const entryGroups = new Map<string, { first?: any; second?: any }>();
    for (const entry of input.entries) {
      const baseUom = entry.item.uoms.find((uom: any) => uom.isBase) ?? entry.item.uoms[0];
      const normalized =
        (Number(entry.countedQty) * Number(entry.itemUom.conversionFactor)) /
        Number(baseUom.conversionFactor);
      const key = `${entry.planId}:${entry.locationId}:${entry.itemId}`;
      const current = entryGroups.get(key) ?? {};
      if (entry.countType === CountType.FIRST) current.first = { entry, normalized, baseUom };
      if (entry.countType === CountType.SECOND) current.second = { entry, normalized, baseUom };
      entryGroups.set(key, current);
    }

    for (const [key, values] of entryGroups.entries()) {
      const [planId, locationId, itemId] = key.split(":");
      const plan = planMap.get(planId);
      if (!plan) continue;
      const referenceQty = snapshotMap.get(`${locationId}:${itemId}`) ?? 0;
      const finalQty = values.second?.normalized ?? values.first?.normalized ?? 0;
      const finalVariance = finalQty - referenceQty;
      const finalVariancePercent = referenceQty
        ? Math.abs((finalVariance / referenceQty) * 100)
        : finalVariance === 0
          ? 0
          : 100;
      const firstSecondVariance = values.first && values.second
        ? Math.abs(values.second.normalized - values.first.normalized)
        : 0;
      const firstSecondPercent =
        values.first && values.first.normalized
          ? Math.abs((firstSecondVariance / values.first.normalized) * 100)
          : values.second
            ? 100
            : 0;

      if (finalVariancePercent >= 10) {
        anomalies.push({
          fingerprint: `HIGH_VARIANCE:${planId}:${locationId}:${itemId}`,
          anomalyType: AnomalyType.HIGH_VARIANCE,
          severity: finalVariancePercent >= 20 ? AnomalySeverity.CRITICAL : AnomalySeverity.HIGH,
          planId,
          warehouseId: plan.warehouseId,
          siteId: values.first?.entry.siteId ?? values.second?.entry.siteId ?? null,
          locationId,
          itemId,
          userId: values.second?.entry.countedByUserId ?? values.first?.entry.countedByUserId ?? null,
          relatedCountEntryId: values.second?.entry.id ?? values.first?.entry.id ?? null,
          summary: `High variance detected for ${values.first?.entry.item.code ?? values.second?.entry.item.code} at ${values.first?.entry.location.code ?? values.second?.entry.location.code}`,
          details: {
            referenceQty,
            finalQty,
            finalVariance,
            finalVariancePercent: Number(finalVariancePercent.toFixed(1)),
          },
        });
      }

      if (Math.abs(finalVariance) >= 50 || finalVariancePercent >= 25) {
        anomalies.push({
          fingerprint: `EXTREME_MISMATCH:${planId}:${locationId}:${itemId}`,
          anomalyType: AnomalyType.EXTREME_MISMATCH,
          severity: AnomalySeverity.CRITICAL,
          planId,
          warehouseId: plan.warehouseId,
          siteId: values.first?.entry.siteId ?? values.second?.entry.siteId ?? null,
          locationId,
          itemId,
          userId: values.second?.entry.countedByUserId ?? values.first?.entry.countedByUserId ?? null,
          relatedCountEntryId: values.second?.entry.id ?? values.first?.entry.id ?? null,
          summary: `Extreme mismatch against system stock detected for item ${values.first?.entry.item.code ?? values.second?.entry.item.code}`,
          details: {
            referenceQty,
            finalQty,
            varianceQty: finalVariance,
            variancePercent: Number(finalVariancePercent.toFixed(1)),
          },
        });
      }

      if (values.first && values.second && firstSecondPercent >= 10) {
        anomalies.push({
          fingerprint: `FIRST_SECOND_MISMATCH:${planId}:${locationId}:${itemId}`,
          anomalyType: AnomalyType.FIRST_SECOND_MISMATCH,
          severity: firstSecondPercent >= 20 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM,
          planId,
          warehouseId: plan.warehouseId,
          siteId: values.first.entry.siteId,
          locationId,
          itemId,
          userId: values.second.entry.countedByUserId,
          relatedCountEntryId: values.second.entry.id,
          summary: `Large mismatch between first and second count detected for ${values.second.entry.item.code}`,
          details: {
            firstQty: values.first.normalized,
            secondQty: values.second.normalized,
            betweenCountsQty: firstSecondVariance,
            betweenCountsPercent: Number(firstSecondPercent.toFixed(1)),
          },
        });
      }

      for (const candidate of [values.first?.entry, values.second?.entry].filter(Boolean)) {
        if (
          Number(candidate.itemUom.conversionFactor) > 1 &&
          Number(candidate.countedQty) % 1 !== 0
        ) {
          anomalies.push({
            fingerprint: `UOM_CONSISTENCY:${candidate.id}`,
            anomalyType: AnomalyType.UOM_CONSISTENCY,
            severity: AnomalySeverity.MEDIUM,
            planId: candidate.planId,
            warehouseId: candidate.warehouseId,
            siteId: candidate.siteId,
            locationId: candidate.locationId,
            itemId: candidate.itemId,
            userId: candidate.countedByUserId,
            relatedCountEntryId: candidate.id,
            summary: `Suspicious fractional quantity captured in non-base UOM ${candidate.itemUom.uomCode}`,
            details: {
              uomCode: candidate.itemUom.uomCode,
              conversionFactor: Number(candidate.itemUom.conversionFactor),
              countedQty: Number(candidate.countedQty),
            },
          });
        }
      }
    }

    const userHighVariance = new Map<string, { count: number; warehouseId: string; userName: string }>();
    for (const anomaly of anomalies.filter((item) => item.anomalyType === AnomalyType.HIGH_VARIANCE && item.userId)) {
      const matchingEntry = input.entries.find((entry) => entry.countedByUserId === anomaly.userId);
      if (!matchingEntry) continue;
      const current = userHighVariance.get(anomaly.userId as string) ?? {
        count: 0,
        warehouseId: matchingEntry.warehouseId,
        userName: matchingEntry.countedByUser.name,
      };
      current.count += 1;
      userHighVariance.set(anomaly.userId as string, current);
    }

    for (const [userId, pattern] of userHighVariance.entries()) {
      if (pattern.count >= 2) {
        anomalies.push({
          fingerprint: `REPEATED_USER_VARIANCE:${userId}`,
          anomalyType: AnomalyType.REPEATED_USER_VARIANCE,
          severity: pattern.count >= 4 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM,
          warehouseId: pattern.warehouseId,
          userId,
          summary: `${pattern.userName} is repeatedly associated with high variance count lines`,
          details: {
            repeatedHighVarianceCount: pattern.count,
          },
        });
      }
    }

    const sortedEntries = [...input.entries].sort(
      (left, right) => left.countedAt.getTime() - right.countedAt.getTime(),
    );
    for (let index = 2; index < sortedEntries.length; index += 1) {
      const current = sortedEntries[index];
      const previous = sortedEntries[index - 1];
      const older = sortedEntries[index - 2];
      if (
        current.countedByUserId === previous.countedByUserId &&
        previous.countedByUserId === older.countedByUserId &&
        current.planId === previous.planId &&
        previous.planId === older.planId &&
        current.countedAt.getTime() - older.countedAt.getTime() <= 30000
      ) {
        anomalies.push({
          fingerprint: `RAPID_COUNTING:${current.countedByUserId}:${current.planId}:${current.id}`,
          anomalyType: AnomalyType.RAPID_COUNTING,
          severity: AnomalySeverity.MEDIUM,
          planId: current.planId,
          warehouseId: current.warehouseId,
          siteId: current.siteId,
          userId: current.countedByUserId,
          relatedCountEntryId: current.id,
          summary: `Rapid repeated counting pattern detected for ${current.countedByUser.name}`,
          details: {
            entryIds: [older.id, previous.id, current.id],
            durationSeconds: Number(((current.countedAt.getTime() - older.countedAt.getTime()) / 1000).toFixed(1)),
          },
        });
      }
    }

    const conflictGroups = new Map<string, { count: number; warehouseId?: string; planId?: string; userId?: string; deviceId?: string }>();
    for (const conflict of input.conflicts.filter((item) => item.status !== ConflictStatus.RESOLVED)) {
      const key = `${conflict.planId}:${conflict.syncQueue?.userId ?? "unknown"}:${conflict.syncQueue?.deviceId ?? "device"}`;
      const plan = planMap.get(conflict.planId);
      const current = conflictGroups.get(key) ?? {
        count: 0,
        warehouseId: plan?.warehouseId,
        planId: conflict.planId,
        userId: conflict.syncQueue?.userId,
        deviceId: conflict.syncQueue?.deviceId,
      };
      current.count += 1;
      conflictGroups.set(key, current);
    }

    for (const [, group] of conflictGroups.entries()) {
      if (group.count >= 2) {
        anomalies.push({
          fingerprint: `REPEATED_SYNC_CONFLICT:${group.planId}:${group.userId}:${group.deviceId}`,
          anomalyType: AnomalyType.REPEATED_SYNC_CONFLICT,
          severity: group.count >= 4 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM,
          planId: group.planId,
          warehouseId: group.warehouseId,
          userId: group.userId,
          summary: `Repeated sync conflicts detected from the same device or user on one plan`,
          details: {
            conflictCount: group.count,
            deviceId: group.deviceId,
          },
        });
      }
    }

    const latestSnapshotImport = input.importJobs.find((job) => job.importType === "STOCK_SNAPSHOT");
    const latestMasterRefresh = input.importJobs.find((job) => job.importType !== "STOCK_SNAPSHOT");
    const staleSnapshotHours = latestSnapshotImport?.completedAt
      ? (Date.now() - latestSnapshotImport.completedAt.getTime()) / 36e5
      : 999;
    const staleMasterHours = latestMasterRefresh?.completedAt
      ? (Date.now() - latestMasterRefresh.completedAt.getTime()) / 36e5
      : 999;

    if (staleSnapshotHours > 48 || staleMasterHours > 72) {
      for (const plan of input.plans.filter((candidate) => candidate.status !== "Completed")) {
        anomalies.push({
          fingerprint: `DATA_FRESHNESS:${plan.id}`,
          anomalyType: AnomalyType.DATA_FRESHNESS,
          severity: staleSnapshotHours > 72 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM,
          planId: plan.id,
          warehouseId: plan.warehouseId,
          summary: `Data freshness risk detected before or during count execution for ${plan.code}`,
          details: {
            latestSnapshotImportAt: latestSnapshotImport?.completedAt?.toISOString() ?? null,
            latestMasterRefreshAt: latestMasterRefresh?.completedAt?.toISOString() ?? null,
            staleSnapshotHours: Number(staleSnapshotHours.toFixed(1)),
            staleMasterHours: Number(staleMasterHours.toFixed(1)),
          },
        });
      }
    }

    return anomalies;
  }

  private buildWhere(query: QueryAnomaliesDto, actor?: CurrentUserPayload): Prisma.AnomalyWhereInput {
    const where: Prisma.AnomalyWhereInput = {
      ...(query.planId ? { planId: query.planId } : {}),
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.siteId ? { siteId: query.siteId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.itemId ? { itemId: query.itemId } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.severity ? { severity: query.severity as AnomalySeverity } : {}),
      ...(query.status ? { status: query.status as AnomalyStatus } : {}),
      ...(query.anomalyType ? { anomalyType: query.anomalyType as AnomalyType } : {}),
      ...((query.dateFrom || query.dateTo)
        ? {
            detectedAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(`${query.dateTo}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    };

    if (actor?.role === ROLE_CODES.AUDITOR && actor.warehouseIds.length) {
      return {
        AND: [where, { warehouseId: { in: actor.warehouseIds } }],
      };
    }

    return where;
  }

  private buildPlanScope(dto: RunAnomaliesDto, actor?: CurrentUserPayload): Prisma.StockTakePlanWhereInput {
    const where: Prisma.StockTakePlanWhereInput = {
      ...(dto.planId ? { id: dto.planId } : {}),
      ...(dto.warehouseId ? { warehouseId: dto.warehouseId } : {}),
      ...(dto.siteId ? { sites: { some: { siteId: dto.siteId } } } : {}),
    };

    if (actor?.role === ROLE_CODES.AUDITOR && actor.warehouseIds.length) {
      return {
        AND: [where, { warehouseId: { in: actor.warehouseIds } }],
      };
    }

    return where;
  }

  private assertAccess(warehouseId: string | null, actor?: CurrentUserPayload) {
    if (!actor) return;
    if (actor.role === ROLE_CODES.SYSTEM_ADMIN || actor.role === ROLE_CODES.MANAGEMENT) return;
    if (actor.role === ROLE_CODES.AUDITOR && warehouseId && !actor.warehouseIds.includes(warehouseId)) {
      throw new ForbiddenException("You do not have access to this anomaly");
    }
  }
}
