import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ConflictResolutionAction,
  ConflictStatus,
  ConflictType,
  CountType,
  Prisma,
  SubmissionStatus,
  SyncActionType,
  SyncStatus,
} from "@prisma/client";
import { AuditLogService } from "src/audit-log/audit-log.service";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { QuerySyncConflictsDto } from "./dto/query-sync-conflicts.dto";
import { QuerySyncQueueDto } from "./dto/query-sync-queue.dto";
import { ResolveSyncConflictDto } from "./dto/resolve-sync-conflict.dto";
import { SyncBatchDto, SyncBatchRecordDto } from "./dto/sync-batch.dto";

type ApplyQueueRecordResult = {
  syncStatus: "CONFLICT" | "PROCESSED" | "SKIPPED";
  message: string;
  conflictId?: string;
  serverEntryId?: string;
};

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async submitBatch(dto: SyncBatchDto, actor?: CurrentUserPayload) {
    if (!actor) {
      throw new ForbiddenException("User context is required");
    }

    await this.auditLogService.log({
      actorUserId: actor.sub,
      action: "SYNC_BATCH_RECEIVED",
      entityType: "SYNC",
      metadata: {
        deviceId: dto.deviceId,
        recordCount: dto.records.length,
      },
    });

    const results = [];

    for (const record of dto.records) {
      results.push(await this.processRecord(record, dto.deviceId, actor));
    }

    await this.auditLogService.log({
      actorUserId: actor.sub,
      action: "SYNC_BATCH_PROCESSED",
      entityType: "SYNC",
      metadata: {
        deviceId: dto.deviceId,
        processed: results.length,
        conflicts: results.filter((item) => item.syncStatus === SyncStatus.CONFLICT).length,
        failed: results.filter((item) => item.syncStatus === SyncStatus.FAILED).length,
      },
    });

    return {
      deviceId: dto.deviceId,
      processedAt: new Date().toISOString(),
      results,
    };
  }

  async getQueue(query: QuerySyncQueueDto, actor?: CurrentUserPayload) {
    const where: Prisma.SyncQueueWhereInput = {
      ...(query.syncStatus ? { syncStatus: query.syncStatus } : {}),
      ...(query.planId ? { planId: query.planId } : {}),
      ...(actor?.role === ROLE_CODES.WAREHOUSE_USER ? { userId: actor.sub } : {}),
    };

    const queue = await this.prisma.syncQueue.findMany({
      where,
      include: {
        plan: true,
        location: true,
        item: true,
        conflicts: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return queue.map((entry) => ({
      id: entry.id,
      planId: entry.planId,
      planCode: entry.plan.code,
      countType: entry.countType,
      actionType: entry.actionType,
      clientEntryId: entry.clientEntryId,
      deviceId: entry.deviceId,
      syncStatus: entry.syncStatus,
      errorMessage: entry.errorMessage,
      locationCode: entry.location?.code ?? null,
      itemCode: entry.item?.code ?? null,
      countedQuantity: entry.countedQuantity ? Number(entry.countedQuantity) : null,
      clientTimestamp: entry.clientTimestamp.toISOString(),
      serverProcessedAt: entry.serverProcessedAt?.toISOString() ?? null,
      latestConflictId: entry.conflicts[0]?.id ?? null,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  async getQueueById(id: string, actor?: CurrentUserPayload) {
    const queue = await this.prisma.syncQueue.findUnique({
      where: { id },
      include: {
        plan: true,
        location: true,
        item: true,
        itemUom: true,
        conflicts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!queue) {
      throw new NotFoundException("Sync queue record not found");
    }

    if (actor?.role === ROLE_CODES.WAREHOUSE_USER && queue.userId !== actor.sub) {
      throw new ForbiddenException("You do not have access to this sync record");
    }

    return queue;
  }

  async getConflicts(query: QuerySyncConflictsDto, actor?: CurrentUserPayload) {
    const where: Prisma.SyncConflictWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.conflictType ? { conflictType: query.conflictType } : {}),
      ...(query.planId ? { planId: query.planId } : {}),
    };

    const conflicts = await this.prisma.syncConflict.findMany({
      where,
      include: {
        plan: true,
        location: true,
        item: true,
        syncQueue: true,
        resolvedBy: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return conflicts.map((conflict) => ({
      id: conflict.id,
      planId: conflict.planId,
      planCode: conflict.plan.code,
      countType: conflict.countType,
      conflictType: conflict.conflictType,
      status: conflict.status,
      actionType: conflict.syncQueue?.actionType ?? null,
      locationCode: conflict.location?.code ?? null,
      itemCode: conflict.item?.code ?? null,
      createdAt: conflict.createdAt.toISOString(),
      resolvedAt: conflict.resolvedAt?.toISOString() ?? null,
      resolutionAction: conflict.resolutionAction ?? null,
      resolvedByName: conflict.resolvedBy?.name ?? null,
    }));
  }

  async getConflictById(id: string, _actor?: CurrentUserPayload) {
    const conflict = await this.prisma.syncConflict.findUnique({
      where: { id },
      include: {
        plan: true,
        location: true,
        item: true,
        itemUom: true,
        syncQueue: true,
        resolvedBy: true,
      },
    });

    if (!conflict) {
      throw new NotFoundException("Sync conflict not found");
    }

    return {
      id: conflict.id,
      planId: conflict.planId,
      planCode: conflict.plan.code,
      countType: conflict.countType,
      conflictType: conflict.conflictType,
      status: conflict.status,
      resolutionAction: conflict.resolutionAction,
      resolvedAt: conflict.resolvedAt?.toISOString() ?? null,
      resolvedByName: conflict.resolvedBy?.name ?? null,
      notes: conflict.notes,
      locationCode: conflict.location?.code ?? null,
      itemCode: conflict.item?.code ?? null,
      uomCode: conflict.uomCode ?? conflict.itemUom?.uomCode ?? null,
      actionType: conflict.syncQueue?.actionType ?? null,
      localValue: conflict.localValue,
      serverValue: conflict.serverValue,
      queueRecord: conflict.syncQueue
        ? {
            id: conflict.syncQueue.id,
            syncStatus: conflict.syncQueue.syncStatus,
            clientEntryId: conflict.syncQueue.clientEntryId,
            deviceId: conflict.syncQueue.deviceId,
            clientTimestamp: conflict.syncQueue.clientTimestamp.toISOString(),
          }
        : null,
      createdAt: conflict.createdAt.toISOString(),
      updatedAt: conflict.updatedAt.toISOString(),
    };
  }

  async resolveConflict(id: string, dto: ResolveSyncConflictDto, actor?: CurrentUserPayload) {
    if (!actor) {
      throw new ForbiddenException("User context is required");
    }

    const conflict = await this.prisma.syncConflict.findUnique({
      where: { id },
      include: {
        syncQueue: true,
        plan: {
          include: {
            countSubmissions: true,
          },
        },
      },
    });

    if (!conflict) {
      throw new NotFoundException("Sync conflict not found");
    }

    if (conflict.status === ConflictStatus.RESOLVED) {
      throw new BadRequestException("This conflict has already been resolved");
    }

    if (!conflict.syncQueue) {
      throw new BadRequestException("Conflict is missing its originating sync record");
    }

    if (dto.resolutionAction === "KEEP_SERVER") {
      return this.completeConflict(conflict.id, conflict.syncQueue.id, actor.sub, ConflictResolutionAction.KEEP_SERVER, ConflictStatus.RESOLVED, dto.notes);
    }

    if (dto.resolutionAction === "MARK_REVIEW") {
      return this.completeConflict(conflict.id, conflict.syncQueue.id, actor.sub, ConflictResolutionAction.MARK_REVIEW, ConflictStatus.REVIEW_REQUIRED, dto.notes);
    }

    if (dto.resolutionAction === "KEEP_LOCAL" || dto.resolutionAction === "RETRY_REPLAY") {
      const replay = await this.applyQueueRecord(conflict.syncQueue, actor, true);
      if (replay.syncStatus === SyncStatus.CONFLICT) {
        throw new BadRequestException(replay.message);
      }
      return this.completeConflict(
        conflict.id,
        conflict.syncQueue.id,
        actor.sub,
        dto.resolutionAction === "KEEP_LOCAL"
          ? ConflictResolutionAction.KEEP_LOCAL
          : ConflictResolutionAction.RETRY_REPLAY,
        ConflictStatus.RESOLVED,
        dto.notes,
      );
    }

    throw new BadRequestException("Unsupported resolution action");
  }

  async getSummary(actor?: CurrentUserPayload) {
    const queueWhere: Prisma.SyncQueueWhereInput =
      actor?.role === ROLE_CODES.WAREHOUSE_USER ? { userId: actor.sub } : {};

    const conflictWhere: Prisma.SyncConflictWhereInput =
      actor?.role === ROLE_CODES.WAREHOUSE_USER
        ? {
            syncQueue: {
              is: {
                userId: actor.sub,
              },
            },
          }
        : {};

    const [queue, unresolvedConflicts, lastProcessed] = await Promise.all([
      this.prisma.syncQueue.groupBy({
        by: ["syncStatus"],
        where: queueWhere,
        _count: { _all: true },
      }),
      this.prisma.syncConflict.count({
        where: {
          ...conflictWhere,
          status: { in: [ConflictStatus.OPEN, ConflictStatus.REVIEW_REQUIRED] },
        },
      }),
      this.prisma.syncQueue.findFirst({
        where: {
          ...queueWhere,
          serverProcessedAt: { not: null },
        },
        orderBy: { serverProcessedAt: "desc" },
      }),
    ]);

    const counts = {
      queued: 0,
      processed: 0,
      failed: 0,
      pending: 0,
      conflicts: unresolvedConflicts,
    };

    for (const row of queue) {
      if (row.syncStatus === SyncStatus.PROCESSED || row.syncStatus === SyncStatus.RESOLVED || row.syncStatus === SyncStatus.SKIPPED) {
        counts.processed += row._count._all;
      }
      if (row.syncStatus === SyncStatus.FAILED) counts.failed += row._count._all;
      if (row.syncStatus === SyncStatus.PENDING) counts.pending += row._count._all;
      if (row.syncStatus === SyncStatus.CONFLICT) counts.queued += row._count._all;
      if (row.syncStatus === SyncStatus.PENDING) counts.queued += row._count._all;
    }

    return {
      ...counts,
      lastSyncAt: lastProcessed?.serverProcessedAt?.toISOString() ?? null,
    };
  }

  private async processRecord(record: SyncBatchRecordDto, deviceId: string, actor: CurrentUserPayload) {
    const existingQueue = await this.prisma.syncQueue.findUnique({
      where: {
        deviceId_clientEntryId_actionType: {
          deviceId,
          clientEntryId: record.clientEntryId,
          actionType: record.actionType,
        },
      },
      include: {
        conflicts: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (existingQueue) {
      return {
        queueId: existingQueue.id,
        clientEntryId: existingQueue.clientEntryId,
        actionType: existingQueue.actionType,
        syncStatus: existingQueue.syncStatus,
        message: existingQueue.errorMessage ?? "Already received from this device.",
        conflictId: existingQueue.conflicts[0]?.id ?? null,
      };
    }

    const queue = await this.prisma.syncQueue.create({
      data: {
        planId: record.planId,
        countType: record.countType,
        warehouseId: record.warehouseId ?? null,
        siteId: record.siteId ?? null,
        locationId: record.locationId ?? null,
        itemId: record.itemId ?? null,
        itemUomId: record.itemUomId ?? null,
        uomCode: record.uomCode ?? null,
        countedQuantity:
          typeof record.countedQuantity === "number"
            ? new Prisma.Decimal(record.countedQuantity)
            : null,
        actionType: record.actionType,
        clientEntryId: record.clientEntryId,
        deviceId,
        clientTimestamp: new Date(record.clientTimestamp),
        userId: actor.sub,
        payloadSnapshot: this.toJsonValue(record as unknown as Record<string, unknown>),
      },
    });

    try {
      const applied = await this.applyQueueRecord(queue, actor, false);
      return {
        queueId: queue.id,
        clientEntryId: queue.clientEntryId,
        actionType: queue.actionType,
        syncStatus: applied.syncStatus,
        message: applied.message,
        conflictId: applied.conflictId ?? null,
        serverEntryId: applied.serverEntryId ?? null,
      };
    } catch (error) {
      await this.prisma.syncQueue.update({
        where: { id: queue.id },
        data: {
          syncStatus: SyncStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "Sync processing failed",
          serverProcessedAt: new Date(),
        },
      });

      await this.auditLogService.log({
        actorUserId: actor.sub,
        action: "SYNC_FAILURE",
        entityType: "SYNC_QUEUE",
        entityId: queue.id,
        metadata: {
          actionType: queue.actionType,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        queueId: queue.id,
        clientEntryId: queue.clientEntryId,
        actionType: queue.actionType,
        syncStatus: SyncStatus.FAILED,
        message: error instanceof Error ? error.message : "Sync processing failed",
        conflictId: null,
      };
    }
  }

  private async applyQueueRecord(
    queue: {
      id: string;
      planId: string;
      countType: CountType;
      actionType: SyncActionType;
      clientTimestamp: Date;
      locationId: string | null;
      itemId: string | null;
      itemUomId: string | null;
      countedQuantity: Prisma.Decimal | null;
      userId: string;
      uomCode: string | null;
      payloadSnapshot: Prisma.JsonValue | null;
    },
    actor: CurrentUserPayload,
    forceReplay: boolean,
  ): Promise<ApplyQueueRecordResult> {
    const plan = await this.prisma.stockTakePlan.findUnique({
      where: { id: queue.planId },
      include: {
        locations: {
          include: {
            location: true,
          },
        },
        countSubmissions: true,
      },
    });

    if (!plan) {
      return this.createConflict(queue, ConflictType.INVALID_REFERENCE, actor, "Plan no longer exists.", null);
    }

    this.assertPlanAccessible(plan, queue.countType, actor);

    const submission = plan.countSubmissions.find((item) => item.countType === queue.countType);
    if (!forceReplay && plan.locked) {
      return this.createConflict(queue, ConflictType.PLAN_LOCKED, actor, "Plan was locked before this queued transaction reached the server.", { locked: true });
    }

    if (!forceReplay && submission?.status === SubmissionStatus.SUBMITTED && queue.actionType !== SyncActionType.SUBMIT) {
      return this.createConflict(queue, ConflictType.SUBMISSION_CONFLICT, actor, "Count type was already submitted on the server.", { submittedAt: submission.submittedAt?.toISOString() ?? null });
    }

    if (queue.actionType === SyncActionType.SUBMIT) {
      return this.applySubmit(queue, plan, actor, forceReplay);
    }

    if (!queue.locationId || !queue.itemId) {
      return this.createConflict(queue, ConflictType.INVALID_REFERENCE, actor, "Queued record is missing required location or item references.", null);
    }

    const scopedLocation = plan.locations.find((item) => item.locationId === queue.locationId);
    if (!scopedLocation) {
      return this.createConflict(queue, ConflictType.OUT_OF_SCOPE, actor, "Queued location is outside the valid plan scope.", null);
    }

    const item = await this.prisma.item.findUnique({
      where: { id: queue.itemId },
      include: { uoms: true },
    });

    if (!item || item.status !== "active") {
      return this.createConflict(queue, ConflictType.INVALID_REFERENCE, actor, "Queued item is missing or inactive.", null);
    }

    const itemUom = queue.itemUomId
      ? item.uoms.find((uom) => uom.id === queue.itemUomId)
      : item.uoms.find((uom) => uom.uomCode === queue.uomCode);

    if (!itemUom && queue.actionType !== SyncActionType.DELETE) {
      return this.createConflict(queue, ConflictType.INVALID_REFERENCE, actor, "Queued UOM is invalid for the selected item.", null);
    }

    const existingEntry = await this.prisma.countEntry.findUnique({
      where: {
        planId_countType_locationId_itemId: {
          planId: queue.planId,
          countType: queue.countType,
          locationId: queue.locationId,
          itemId: queue.itemId,
        },
      },
      include: {
        itemUom: true,
      },
    });

    if (queue.actionType === SyncActionType.CREATE) {
      if (existingEntry) {
        const sameValue =
          Number(existingEntry.countedQty) === Number(queue.countedQuantity ?? 0) &&
          existingEntry.itemUomId === (itemUom?.id ?? queue.itemUomId);

        if (sameValue) {
          await this.prisma.syncQueue.update({
            where: { id: queue.id },
            data: {
              syncStatus: SyncStatus.SKIPPED,
              errorMessage: "Server already contains the same count line.",
              serverProcessedAt: new Date(),
            },
          });

          return {
            syncStatus: SyncStatus.SKIPPED,
            message: "Server already contains the same count line.",
            serverEntryId: existingEntry.id,
          };
        }

        return this.createConflict(
          queue,
          ConflictType.DUPLICATE_LINE,
          actor,
          "A count line for the same plan, count type, location, and item already exists on the server.",
          this.serializeEntry(existingEntry),
        );
      }

      const created = await this.prisma.countEntry.create({
        data: {
          planId: queue.planId,
          countType: queue.countType,
          warehouseId: scopedLocation.location.warehouseId,
          siteId: scopedLocation.location.siteId,
          locationId: queue.locationId,
          itemId: queue.itemId,
          itemUomId: itemUom!.id,
          countedQty: queue.countedQuantity ?? new Prisma.Decimal(0),
          countedByUserId: queue.userId,
          countedAt: queue.clientTimestamp,
        },
      });

      await this.markQueueProcessed(queue.id);
      await this.promotePlanInProgress(queue.planId, plan.status);
      return {
        syncStatus: SyncStatus.PROCESSED,
        message: "Queued count line created on server.",
        serverEntryId: created.id,
      };
    }

    if (queue.actionType === SyncActionType.UPDATE) {
      if (!existingEntry) {
        return this.createConflict(queue, ConflictType.INVALID_REFERENCE, actor, "Server could not find the count line referenced by this queued update.", null);
      }

      if (!forceReplay && existingEntry.updatedAt > queue.clientTimestamp) {
        return this.createConflict(
          queue,
          ConflictType.SERVER_STATE_MISMATCH,
          actor,
          "Server entry was changed after the device created this queued update.",
          this.serializeEntry(existingEntry),
        );
      }

      await this.prisma.countEntry.update({
        where: { id: existingEntry.id },
        data: {
          itemUomId: itemUom?.id ?? existingEntry.itemUomId,
          countedQty: queue.countedQuantity ?? existingEntry.countedQty,
          countedByUserId: queue.userId,
          countedAt: queue.clientTimestamp,
        },
      });

      await this.markQueueProcessed(queue.id);
      return {
        syncStatus: SyncStatus.PROCESSED,
        message: "Queued update applied on server.",
        serverEntryId: existingEntry.id,
      };
    }

    if (queue.actionType === SyncActionType.DELETE) {
      if (!existingEntry) {
        await this.prisma.syncQueue.update({
          where: { id: queue.id },
          data: {
            syncStatus: SyncStatus.SKIPPED,
            errorMessage: "Server entry was already removed.",
            serverProcessedAt: new Date(),
          },
        });

        return {
          syncStatus: SyncStatus.SKIPPED,
          message: "Server entry was already removed.",
        };
      }

      if (!forceReplay && existingEntry.updatedAt > queue.clientTimestamp) {
        return this.createConflict(
          queue,
          ConflictType.SERVER_STATE_MISMATCH,
          actor,
          "Server entry changed after this delete was queued.",
          this.serializeEntry(existingEntry),
        );
      }

      await this.prisma.countEntry.delete({
        where: { id: existingEntry.id },
      });

      await this.markQueueProcessed(queue.id);
      return {
        syncStatus: SyncStatus.PROCESSED,
        message: "Queued delete applied on server.",
      };
    }

    throw new BadRequestException("Unsupported sync action");
  }

  private async applySubmit(
    queue: {
      id: string;
      planId: string;
      countType: CountType;
      userId: string;
      clientTimestamp: Date;
      payloadSnapshot: Prisma.JsonValue | null;
    },
    plan: {
      id: string;
      status: string;
      locked: boolean;
      countSubmissions: Array<{
        countType: CountType;
        status: SubmissionStatus;
        submittedAt: Date | null;
      }>;
    },
    actor: CurrentUserPayload,
    forceReplay: boolean,
  ) {
    const submission = plan.countSubmissions.find((item) => item.countType === queue.countType);
    if (!submission) {
      return this.createConflict(queue, ConflictType.INVALID_REFERENCE, actor, "Submission record was not found for this plan and count type.", null);
    }

    if (!forceReplay && submission.status === SubmissionStatus.SUBMITTED) {
      return this.createConflict(
        queue,
        ConflictType.SUBMISSION_CONFLICT,
        actor,
        "Server already processed this submission before the device reconnected.",
        { submittedAt: submission.submittedAt?.toISOString() ?? null },
      );
    }

    const entryCount = await this.prisma.countEntry.count({
      where: { planId: queue.planId, countType: queue.countType },
    });

    if (!entryCount) {
      throw new BadRequestException("At least one count entry is required before offline submission can sync.");
    }

    await this.prisma.countSubmission.update({
      where: {
        planId_countType: {
          planId: queue.planId,
          countType: queue.countType,
        },
      },
      data: {
        status: SubmissionStatus.SUBMITTED,
        submittedByUserId: queue.userId,
        submittedAt: queue.clientTimestamp,
        notes:
          (queue.payloadSnapshot &&
          typeof queue.payloadSnapshot === "object" &&
          "notes" in queue.payloadSnapshot
            ? String(queue.payloadSnapshot.notes ?? "")
            : undefined) || undefined,
      },
    });

    const allSubmissions = await this.prisma.countSubmission.findMany({
      where: { planId: queue.planId },
    });
    const allSubmitted = allSubmissions.every((item) => item.status === SubmissionStatus.SUBMITTED);
    await this.prisma.stockTakePlan.update({
      where: { id: queue.planId },
      data: {
        status: allSubmitted ? "Completed" : "In Progress",
        locked: allSubmitted ? true : plan.locked,
      },
    });

    await this.markQueueProcessed(queue.id);
    return {
      syncStatus: SyncStatus.PROCESSED,
      message: "Queued submission applied on server.",
    };
  }

  private async createConflict(
    queue: {
      id: string;
      planId: string;
      countType: CountType;
      locationId?: string | null;
      itemId?: string | null;
      itemUomId?: string | null;
      uomCode?: string | null;
      payloadSnapshot?: Prisma.JsonValue | null;
    },
    conflictType: ConflictType,
    actor: CurrentUserPayload,
    message: string,
    serverValue: Record<string, unknown> | null,
  ) {
    const conflict = await this.prisma.syncConflict.create({
      data: {
        syncQueueId: queue.id,
        planId: queue.planId,
        countType: queue.countType,
        locationId: queue.locationId ?? null,
        itemId: queue.itemId ?? null,
        itemUomId: queue.itemUomId ?? null,
        uomCode: queue.uomCode ?? null,
        localValue: this.toJsonValue(
          (queue.payloadSnapshot as Record<string, unknown> | null) ?? {
            queueId: queue.id,
          },
        ),
        serverValue: serverValue ? this.toJsonValue(serverValue) : undefined,
        conflictType,
        status: ConflictStatus.OPEN,
        notes: message,
      },
    });

    await this.prisma.syncQueue.update({
      where: { id: queue.id },
      data: {
        syncStatus: SyncStatus.CONFLICT,
        errorMessage: message,
        serverProcessedAt: new Date(),
      },
    });

    await this.auditLogService.log({
      actorUserId: actor.sub,
      action: "SYNC_CONFLICT_CREATED",
      entityType: "SYNC_CONFLICT",
      entityId: conflict.id,
      metadata: {
        planId: queue.planId,
        countType: queue.countType,
        conflictType,
      },
    });

    return {
      syncStatus: SyncStatus.CONFLICT,
      message,
      conflictId: conflict.id,
    };
  }

  private async completeConflict(
    conflictId: string,
    queueId: string,
    resolvedById: string,
    resolutionAction: ConflictResolutionAction,
    status: ConflictStatus,
    notes?: string,
  ) {
    const resolved = await this.prisma.syncConflict.update({
      where: { id: conflictId },
      data: {
        status,
        resolutionAction,
        resolvedById,
        resolvedAt: new Date(),
        notes,
      },
    });

    await this.prisma.syncQueue.update({
      where: { id: queueId },
      data: {
        syncStatus: status === ConflictStatus.REVIEW_REQUIRED ? SyncStatus.CONFLICT : SyncStatus.RESOLVED,
        errorMessage: status === ConflictStatus.REVIEW_REQUIRED ? "Marked for manual review." : null,
        serverProcessedAt: new Date(),
      },
    });

    await this.auditLogService.log({
      actorUserId: resolvedById,
      action: "SYNC_CONFLICT_RESOLVED",
      entityType: "SYNC_CONFLICT",
      entityId: resolved.id,
      metadata: {
        resolutionAction,
        status,
      },
    });

    return {
      success: true,
      conflictId: resolved.id,
      status: resolved.status,
      resolutionAction: resolved.resolutionAction,
      resolvedAt: resolved.resolvedAt?.toISOString() ?? null,
    };
  }

  private async markQueueProcessed(queueId: string) {
    await this.prisma.syncQueue.update({
      where: { id: queueId },
      data: {
        syncStatus: SyncStatus.PROCESSED,
        serverProcessedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  private async promotePlanInProgress(planId: string, currentStatus: string) {
    if (currentStatus === "Completed") return;
    await this.prisma.stockTakePlan.update({
      where: { id: planId },
      data: { status: "In Progress" },
    });
  }

  private assertPlanAccessible(
    plan: { firstCountUserId: string; secondCountUserId: string; warehouseId?: string },
    countType: CountType,
    actor: CurrentUserPayload,
  ) {
    if (actor.role === ROLE_CODES.SYSTEM_ADMIN || actor.role === ROLE_CODES.AUDITOR) {
      return;
    }

    if (countType === CountType.FIRST && plan.firstCountUserId !== actor.sub) {
      throw new ForbiddenException("You are not assigned to sync first-count data for this plan");
    }

    if (countType === CountType.SECOND && plan.secondCountUserId !== actor.sub) {
      throw new ForbiddenException("You are not assigned to sync second-count data for this plan");
    }

    if (plan.warehouseId && !actor.warehouseIds.includes(plan.warehouseId)) {
      throw new ForbiddenException("Warehouse scope does not match your access");
    }
  }

  private serializeEntry(entry: {
    id: string;
    itemUom?: { uomCode: string };
    itemUomId: string;
    countedQty: Prisma.Decimal;
    updatedAt: Date;
  }) {
    return {
      id: entry.id,
      itemUomId: entry.itemUomId,
      uomCode: entry.itemUom?.uomCode ?? null,
      countedQty: Number(entry.countedQty),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }

  private toJsonValue(value: Record<string, unknown>) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
