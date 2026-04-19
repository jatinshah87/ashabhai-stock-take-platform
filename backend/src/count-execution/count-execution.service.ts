import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CountType, SubmissionStatus } from "@prisma/client";
import { AuditLogService } from "src/audit-log/audit-log.service";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { ListCountEntriesDto } from "./dto/list-count-entries.dto";
import { SubmitCountDto } from "./dto/submit-count.dto";
import { UpdateCountEntryDto } from "./dto/update-count-entry.dto";
import { UpsertCountEntryDto } from "./dto/upsert-count-entry.dto";
import { ValidateItemBarcodeDto } from "./dto/validate-item-barcode.dto";
import { ValidateLocationBarcodeDto } from "./dto/validate-location-barcode.dto";

@Injectable()
export class CountExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listMyAssignedPlans(actor?: CurrentUserPayload) {
    if (!actor) {
      throw new ForbiddenException("User context is required");
    }

    const plans = await this.prisma.stockTakePlan.findMany({
      where: {
        OR: [{ firstCountUserId: actor.sub }, { secondCountUserId: actor.sub }],
      },
      include: {
        warehouse: true,
        sites: { include: { site: true } },
        locations: { include: { location: true } },
        countSubmissions: true,
        _count: { select: { countEntries: true } },
      },
      orderBy: [{ scheduledDate: "asc" }, { name: "asc" }],
    });

    return Promise.all(
      plans.map(async (plan) => {
        const assignmentTypes = this.getAssignmentTypes(plan, actor);
        const progress = await Promise.all(
          assignmentTypes.map(async (countType) => {
            const entryCount = await this.prisma.countEntry.count({
              where: { planId: plan.id, countType },
            });
            const submission = plan.countSubmissions.find((item) => item.countType === countType);
            return {
              countType,
              entryCount,
              locationScopeCount: plan.locations.length,
              submitted: submission?.status === SubmissionStatus.SUBMITTED,
              submittedAt: submission?.submittedAt?.toISOString() ?? null,
              readOnly: submission?.status === SubmissionStatus.SUBMITTED || plan.locked,
            };
          }),
        );

        return {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          status: plan.status,
          locked: plan.locked,
          warehouse: {
            id: plan.warehouse.id,
            name: plan.warehouse.name,
            code: plan.warehouse.code,
          },
          sites: plan.sites.map((item) => ({
            id: item.site.id,
            name: item.site.name,
            code: item.site.code,
          })),
          locations: plan.locations.map((item) => ({
            id: item.location.id,
            code: item.location.code,
            name: item.location.name,
            barcode: item.location.barcode,
          })),
          scheduledDate: plan.scheduledDate.toISOString().slice(0, 10),
          scheduleWindow: plan.scheduleWindow,
          assignmentTypes,
          progress,
        };
      }),
    );
  }

  async getPlanExecution(planId: string, requestedCountType: CountType | undefined, actor?: CurrentUserPayload) {
    const plan = await this.getPlanContext(planId);
    this.assertPlanVisible(plan, actor);

    const assignmentTypes = actor ? this.getAssignmentTypes(plan, actor) : [];
    const activeCountType =
      requestedCountType ??
      assignmentTypes[0] ??
      (plan.firstCountUserId === actor?.sub ? CountType.FIRST : CountType.SECOND);

    const submission = plan.countSubmissions.find((item) => item.countType === activeCountType);
    const entryCount = await this.prisma.countEntry.count({
      where: { planId, countType: activeCountType },
    });

    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      countMethod: plan.countMethod,
      instructions: plan.instructions,
      notes: plan.notes,
      status: plan.status,
      locked: plan.locked,
      warehouse: {
        id: plan.warehouse.id,
        name: plan.warehouse.name,
        code: plan.warehouse.code,
      },
      sites: plan.sites.map((item) => ({
        id: item.site.id,
        name: item.site.name,
        code: item.site.code,
      })),
      locations: plan.locations.map((item) => ({
        id: item.location.id,
        siteId: item.location.siteId,
        code: item.location.code,
        name: item.location.name,
        barcode: item.location.barcode,
      })),
      assignments: {
        firstCountUserId: plan.firstCountUserId,
        secondCountUserId: plan.secondCountUserId,
        assignmentTypes,
        activeCountType,
      },
      submission: {
        countType: activeCountType,
        status: submission?.status ?? SubmissionStatus.DRAFT,
        submittedAt: submission?.submittedAt?.toISOString() ?? null,
        submittedByUserId: submission?.submittedByUserId ?? null,
        readOnly: plan.locked || submission?.status === SubmissionStatus.SUBMITTED,
      },
      progress: {
        entryCount,
        locationScopeCount: plan.locations.length,
      },
    };
  }

  async validateLocation(planId: string, dto: ValidateLocationBarcodeDto, actor?: CurrentUserPayload) {
    const plan = await this.getPlanContext(planId);
    await this.assertCanExecute(plan, dto.countType, actor);

    const location = await this.prisma.location.findUnique({
      where: { barcode: dto.barcode },
    });

    if (!location) {
      throw new NotFoundException("Location barcode not found");
    }

    const inScope = plan.locations.some((item) => item.locationId === location.id);
    if (!inScope) {
      throw new BadRequestException("Scanned location is outside the selected plan scope");
    }

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "VALIDATE_LOCATION_BARCODE",
      entityType: "COUNT_EXECUTION",
      entityId: planId,
      metadata: {
        countType: dto.countType,
        barcode: dto.barcode,
        locationId: location.id,
      },
    });

    return {
      id: location.id,
      siteId: location.siteId,
      warehouseId: location.warehouseId,
      code: location.code,
      name: location.name,
      barcode: location.barcode,
      aisle: location.aisle,
      zone: location.zone,
    };
  }

  async validateItem(planId: string, dto: ValidateItemBarcodeDto, actor?: CurrentUserPayload) {
    const plan = await this.getPlanContext(planId);
    await this.assertCanExecute(plan, dto.countType, actor);

    if (dto.locationId && !plan.locations.some((item) => item.locationId === dto.locationId)) {
      throw new BadRequestException("Selected location is outside the plan scope");
    }

    const itemBarcode = await this.prisma.itemBarcode.findUnique({
      where: { barcode: dto.barcode },
      include: {
        item: {
          include: {
            uoms: true,
            barcodes: true,
          },
        },
      },
    });

    if (!itemBarcode || itemBarcode.item.status !== "active") {
      throw new NotFoundException("Item barcode not found or inactive");
    }

    const snapshotQty = dto.locationId
      ? await this.prisma.stockSnapshot.findMany({
          where: {
            locationId: dto.locationId,
            itemId: itemBarcode.itemId,
          },
          include: { itemUom: true },
        })
      : [];

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "VALIDATE_ITEM_BARCODE",
      entityType: "COUNT_EXECUTION",
      entityId: planId,
      metadata: {
        countType: dto.countType,
        barcode: dto.barcode,
        itemId: itemBarcode.itemId,
        locationId: dto.locationId,
      },
    });

    return {
      id: itemBarcode.item.id,
      code: itemBarcode.item.code,
      description: itemBarcode.item.description,
      scannedBarcode: itemBarcode.barcode,
      scannedUomCode: itemBarcode.uomCode,
      uoms: itemBarcode.item.uoms.map((uom) => ({
        id: uom.id,
        uomCode: uom.uomCode,
        conversionFactor: Number(uom.conversionFactor),
        isBase: uom.isBase,
      })),
      snapshots: snapshotQty.map((snapshot) => ({
        id: snapshot.id,
        uomCode: snapshot.itemUom.uomCode,
        quantity: Number(snapshot.quantity),
        snapshotAt: snapshot.snapshotAt.toISOString(),
      })),
    };
  }

  async listEntries(planId: string, query: ListCountEntriesDto, actor?: CurrentUserPayload) {
    const plan = await this.getPlanContext(planId);
    this.assertPlanVisible(plan, actor);
    await this.assertCountTypeAccessible(plan, query.countType, actor);

    const entries = await this.prisma.countEntry.findMany({
      where: { planId, countType: query.countType },
      include: {
        location: true,
        item: true,
        itemUom: true,
        countedByUser: true,
      },
      orderBy: [{ countedAt: "desc" }],
    });

    return entries.map((entry) => this.toEntryResponse(entry));
  }

  async getReview(planId: string, query: ListCountEntriesDto, actor?: CurrentUserPayload) {
    const plan = await this.getPlanContext(planId);
    this.assertPlanVisible(plan, actor);
    await this.assertCountTypeAccessible(plan, query.countType, actor);

    const entries = await this.prisma.countEntry.findMany({
      where: { planId, countType: query.countType },
      include: {
        location: true,
        item: true,
        itemUom: true,
        countedByUser: true,
      },
      orderBy: [{ location: { code: "asc" } }, { item: { code: "asc" } }],
    });

    const grouped = new Map<
      string,
      {
        locationId: string;
        locationCode: string;
        locationName: string;
        entryCount: number;
        lines: ReturnType<CountExecutionService["toEntryResponse"]>[];
      }
    >();

    for (const entry of entries) {
      const key = entry.locationId;
      const current = grouped.get(key) ?? {
        locationId: entry.locationId,
        locationCode: entry.location.code,
        locationName: entry.location.name,
        entryCount: 0,
        lines: [],
      };
      current.entryCount += 1;
      current.lines.push(this.toEntryResponse(entry));
      grouped.set(key, current);
    }

    const submission = plan.countSubmissions.find((item) => item.countType === query.countType);

    return {
      summary: {
        planId,
        countType: query.countType,
        entryCount: entries.length,
        locationCount: grouped.size,
        readOnly: plan.locked || submission?.status === SubmissionStatus.SUBMITTED,
        submittedAt: submission?.submittedAt?.toISOString() ?? null,
      },
      groups: Array.from(grouped.values()),
    };
  }

  async saveEntry(planId: string, dto: UpsertCountEntryDto, actor?: CurrentUserPayload) {
    const plan = await this.getPlanContext(planId);
    await this.assertCanExecute(plan, dto.countType, actor);

    const location = await this.assertLocationInScope(plan, dto.locationId);
    const item = await this.assertItemAndUom(dto.itemId, dto.itemUomId);

    const entry = await this.prisma.countEntry.upsert({
      where: {
        planId_countType_locationId_itemId: {
          planId,
          countType: dto.countType,
          locationId: dto.locationId,
          itemId: dto.itemId,
        },
      },
      update: {
        itemUomId: dto.itemUomId,
        countedQty: dto.countedQty,
        countedByUserId: actor!.sub,
        countedAt: new Date(),
      },
      create: {
        planId,
        countType: dto.countType,
        warehouseId: location.warehouseId,
        siteId: location.siteId,
        locationId: dto.locationId,
        itemId: dto.itemId,
        itemUomId: dto.itemUomId,
        countedQty: dto.countedQty,
        countedByUserId: actor!.sub,
        countedAt: new Date(),
      },
      include: {
        location: true,
        item: true,
        itemUom: true,
        countedByUser: true,
      },
    });

    await this.prisma.stockTakePlan.update({
      where: { id: planId },
      data: {
        status: plan.status === "Completed" ? plan.status : "In Progress",
      },
    });

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "SAVE_COUNT_ENTRY",
      entityType: "COUNT_ENTRY",
      entityId: entry.id,
      metadata: {
        planId,
        countType: dto.countType,
        locationId: dto.locationId,
        itemId: dto.itemId,
        itemCode: item.code,
        countedQty: dto.countedQty,
      },
    });

    return this.toEntryResponse(entry);
  }

  async updateEntry(
    planId: string,
    entryId: string,
    dto: UpdateCountEntryDto,
    actor?: CurrentUserPayload,
  ) {
    const plan = await this.getPlanContext(planId);
    await this.assertCanExecute(plan, dto.countType, actor);

    const existing = await this.prisma.countEntry.findUnique({
      where: { id: entryId },
      include: {
        item: true,
        location: true,
        itemUom: true,
        countedByUser: true,
      },
    });

    if (!existing || existing.planId !== planId || existing.countType !== dto.countType) {
      throw new NotFoundException("Count entry not found");
    }

    if (dto.itemUomId) {
      await this.assertItemAndUom(existing.itemId, dto.itemUomId);
    }

    const updated = await this.prisma.countEntry.update({
      where: { id: entryId },
      data: {
        itemUomId: dto.itemUomId ?? existing.itemUomId,
        countedQty: dto.countedQty ?? Number(existing.countedQty),
        countedByUserId: actor!.sub,
        countedAt: new Date(),
      },
      include: {
        location: true,
        item: true,
        itemUom: true,
        countedByUser: true,
      },
    });

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "UPDATE_COUNT_ENTRY",
      entityType: "COUNT_ENTRY",
      entityId: updated.id,
      metadata: {
        planId,
        countType: dto.countType,
        countedQty: dto.countedQty ?? Number(existing.countedQty),
      },
    });

    return this.toEntryResponse(updated);
  }

  async deleteEntry(
    planId: string,
    entryId: string,
    query: ListCountEntriesDto,
    actor?: CurrentUserPayload,
  ) {
    const plan = await this.getPlanContext(planId);
    await this.assertCanExecute(plan, query.countType, actor);

    const existing = await this.prisma.countEntry.findUnique({
      where: { id: entryId },
    });

    if (!existing || existing.planId !== planId || existing.countType !== query.countType) {
      throw new NotFoundException("Count entry not found");
    }

    await this.prisma.countEntry.delete({ where: { id: entryId } });

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "DELETE_COUNT_ENTRY",
      entityType: "COUNT_ENTRY",
      entityId: entryId,
      metadata: {
        planId,
        countType: query.countType,
      },
    });

    return { success: true };
  }

  async submit(planId: string, dto: SubmitCountDto, actor?: CurrentUserPayload) {
    const plan = await this.getPlanContext(planId);
    await this.assertCanExecute(plan, dto.countType, actor);

    const entryCount = await this.prisma.countEntry.count({
      where: { planId, countType: dto.countType },
    });

    if (!entryCount) {
      throw new BadRequestException("At least one count entry is required before submission");
    }

    const submission = await this.prisma.countSubmission.update({
      where: {
        planId_countType: {
          planId,
          countType: dto.countType,
        },
      },
      data: {
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedByUserId: actor!.sub,
        notes: dto.notes,
      },
    });

    const allSubmissions = await this.prisma.countSubmission.findMany({
      where: { planId },
    });

    const allSubmitted = allSubmissions.every((item) => item.status === SubmissionStatus.SUBMITTED);
    const updatedPlan = await this.prisma.stockTakePlan.update({
      where: { id: planId },
      data: {
        status: allSubmitted ? "Completed" : "In Progress",
        locked: allSubmitted ? true : plan.locked,
      },
    });

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "SUBMIT_COUNT",
      entityType: "COUNT_SUBMISSION",
      entityId: submission.id,
      metadata: {
        planId,
        countType: dto.countType,
        entryCount,
      },
    });

    if (allSubmitted && updatedPlan.locked) {
      await this.auditLogService.log({
        actorUserId: actor?.sub,
        action: "LOCK_PLAN_AFTER_SUBMISSION",
        entityType: "STOCK_TAKE_PLAN",
        entityId: planId,
        metadata: {
          planId,
          status: updatedPlan.status,
        },
      });
    }

    return {
      success: true,
      planId,
      countType: dto.countType,
      submittedAt: submission.submittedAt?.toISOString() ?? null,
      locked: updatedPlan.locked,
      status: updatedPlan.status,
    };
  }

  private async getPlanContext(planId: string) {
    const plan = await this.prisma.stockTakePlan.findUnique({
      where: { id: planId },
      include: {
        warehouse: true,
        sites: { include: { site: true } },
        locations: { include: { location: true } },
        countSubmissions: true,
      },
    });

    if (!plan) {
      throw new NotFoundException("Stock take plan not found");
    }

    return plan;
  }

  private assertPlanVisible(plan: Awaited<ReturnType<CountExecutionService["getPlanContext"]>>, actor?: CurrentUserPayload) {
    if (!actor) {
      throw new ForbiddenException("User context is required");
    }

    const assigned =
      plan.firstCountUserId === actor.sub ||
      plan.secondCountUserId === actor.sub ||
      actor.role === ROLE_CODES.SYSTEM_ADMIN ||
      actor.role === ROLE_CODES.AUDITOR;

    if (!assigned) {
      throw new ForbiddenException("You do not have access to this stock take plan");
    }

    if (
      actor.role === ROLE_CODES.WAREHOUSE_USER &&
      !actor.warehouseIds.includes(plan.warehouseId)
    ) {
      throw new ForbiddenException("Warehouse scope does not match your access");
    }
  }

  private async assertCanExecute(
    plan: Awaited<ReturnType<CountExecutionService["getPlanContext"]>>,
    countType: CountType,
    actor?: CurrentUserPayload,
  ) {
    this.assertPlanVisible(plan, actor);
    await this.assertCountTypeAccessible(plan, countType, actor, true);

    const submission = plan.countSubmissions.find((item) => item.countType === countType);
    if (submission?.status === SubmissionStatus.SUBMITTED) {
      throw new BadRequestException("This count has already been submitted and is now read-only");
    }

    if (plan.locked) {
      throw new BadRequestException("This plan is locked and cannot accept new count entries");
    }
  }

  private async assertCountTypeAccessible(
    plan: Awaited<ReturnType<CountExecutionService["getPlanContext"]>>,
    countType: CountType,
    actor?: CurrentUserPayload,
    requireAssigned = false,
  ) {
    if (!actor) {
      throw new ForbiddenException("User context is required");
    }

    const isFirst = plan.firstCountUserId === actor.sub;
    const isSecond = plan.secondCountUserId === actor.sub;

    if (requireAssigned) {
      if (countType === CountType.FIRST && !isFirst) {
        throw new ForbiddenException("You are not assigned to perform first count for this plan");
      }

      if (countType === CountType.SECOND && !isSecond) {
        throw new ForbiddenException("You are not assigned to perform second count for this plan");
      }
      return;
    }

    if (
      actor.role === ROLE_CODES.WAREHOUSE_USER &&
      ((countType === CountType.FIRST && !isFirst) || (countType === CountType.SECOND && !isSecond))
    ) {
      throw new ForbiddenException("You do not have access to this count type");
    }
  }

  private getAssignmentTypes(
    plan: { firstCountUserId: string; secondCountUserId: string },
    actor: CurrentUserPayload,
  ) {
    const types: CountType[] = [];
    if (plan.firstCountUserId === actor.sub) types.push(CountType.FIRST);
    if (plan.secondCountUserId === actor.sub) types.push(CountType.SECOND);
    return types;
  }

  private async assertLocationInScope(
    plan: Awaited<ReturnType<CountExecutionService["getPlanContext"]>>,
    locationId: string,
  ) {
    const scopedLocation = plan.locations.find((item) => item.locationId === locationId);
    if (!scopedLocation) {
      throw new BadRequestException("Selected location is outside the plan scope");
    }

    return scopedLocation.location;
  }

  private async assertItemAndUom(itemId: string, itemUomId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { uoms: true },
    });

    if (!item || item.status !== "active") {
      throw new BadRequestException("Selected item is invalid or inactive");
    }

    const validUom = item.uoms.find((uom) => uom.id === itemUomId);
    if (!validUom) {
      throw new BadRequestException("Selected UOM is not valid for this item");
    }

    return item;
  }

  private toEntryResponse(entry: {
    id: string;
    countType: CountType;
    locationId: string;
    countedQty: unknown;
    countedAt: Date;
    location: { code: string; name: string };
    item: { id: string; code: string; description: string };
    itemUom: { id: string; uomCode: string };
    countedByUser: { id: string; name: string };
  }) {
    return {
      id: entry.id,
      countType: entry.countType,
      locationId: entry.locationId,
      locationCode: entry.location.code,
      locationName: entry.location.name,
      itemId: entry.item.id,
      itemCode: entry.item.code,
      itemDescription: entry.item.description,
      itemUomId: entry.itemUom.id,
      uomCode: entry.itemUom.uomCode,
      countedQty: Number(entry.countedQty),
      countedAt: entry.countedAt.toISOString(),
      countedByUserId: entry.countedByUser.id,
      countedByName: entry.countedByUser.name,
    };
  }
}
