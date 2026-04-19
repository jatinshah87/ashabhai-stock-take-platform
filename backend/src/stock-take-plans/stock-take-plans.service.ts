import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditLogService } from "src/audit-log/audit-log.service";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateStockTakePlanDto } from "./dto/create-stock-take-plan.dto";
import { QueryStockTakePlansDto } from "./dto/query-stock-take-plans.dto";
import { UpdateStockTakePlanDto } from "./dto/update-stock-take-plan.dto";

@Injectable()
export class StockTakePlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async list(dto: QueryStockTakePlansDto, actor?: CurrentUserPayload) {
    const plans = await this.prisma.stockTakePlan.findMany({
      where: {
        AND: [
          dto.search
            ? {
                OR: [
                  { name: { contains: dto.search, mode: "insensitive" } },
                  { code: { contains: dto.search, mode: "insensitive" } },
                  { description: { contains: dto.search, mode: "insensitive" } },
                ],
              }
            : {},
          dto.status ? { status: dto.status } : {},
          dto.warehouseId ? { warehouseId: dto.warehouseId } : {},
          this.buildAccessWhere(actor),
        ],
      },
      include: {
        sites: true,
        locations: true,
      },
      orderBy: [{ scheduledDate: "asc" }, { name: "asc" }],
    });

    return plans.map((plan) => this.toPlanResponse(plan));
  }

  async findOne(id: string, actor?: CurrentUserPayload) {
    const plan = await this.prisma.stockTakePlan.findUnique({
      where: { id },
      include: {
        sites: true,
        locations: true,
      },
    });

    if (!plan) {
      throw new NotFoundException("Stock take plan not found");
    }

    this.assertPlanAccess(plan, actor);

    return this.toPlanResponse(plan);
  }

  async calendar(actor?: CurrentUserPayload) {
    const plans = await this.prisma.stockTakePlan.findMany({
      where: this.buildAccessWhere(actor),
      include: {
        sites: true,
        locations: true,
      },
      orderBy: [{ scheduledDate: "asc" }, { name: "asc" }],
    });

    return plans.map((plan) => this.toPlanResponse(plan));
  }

  async create(dto: CreateStockTakePlanDto, actor?: CurrentUserPayload) {
    await this.validatePlan(dto);

    let plan;

    try {
      plan = await this.prisma.stockTakePlan.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          warehouseId: dto.warehouseId,
          scheduledDate: new Date(dto.scheduledDate),
          scheduleWindow: dto.scheduleWindow,
          firstCountUserId: dto.firstCountUserId,
          secondCountUserId: dto.secondCountUserId,
          notes: dto.notes,
          instructions: dto.instructions,
          countMethod: dto.countMethod,
          locked: dto.locked ?? false,
          highVariancePlaceholder: dto.highVariancePlaceholder ?? false,
          status: dto.status,
          sites: {
            create: dto.siteIds.map((siteId) => ({ siteId })),
          },
        locations: {
          create: dto.locationIds.map((locationId) => ({ locationId })),
        },
        countSubmissions: {
          create: [{ countType: "FIRST" }, { countType: "SECOND" }],
        },
      },
      include: {
        sites: true,
          locations: true,
        },
      });
    } catch (error) {
      this.handleConstraintError(error);
      throw error;
    }

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "CREATE_STOCK_TAKE_PLAN",
      entityType: "STOCK_TAKE_PLAN",
      entityId: plan.id,
      metadata: {
        warehouseId: dto.warehouseId,
        siteIds: dto.siteIds,
        locationIds: dto.locationIds,
        firstCountUserId: dto.firstCountUserId,
        secondCountUserId: dto.secondCountUserId,
      },
    });

    return this.toPlanResponse(plan);
  }

  async update(id: string, dto: UpdateStockTakePlanDto, actor?: CurrentUserPayload) {
    const existing = await this.prisma.stockTakePlan.findUnique({
      where: { id },
      include: {
        sites: true,
        locations: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Stock take plan not found");
    }

    const merged = {
      ...existing,
      ...dto,
      siteIds: dto.siteIds ?? existing.sites.map((item) => item.siteId),
      locationIds: dto.locationIds ?? existing.locations.map((item) => item.locationId),
    };

    await this.validatePlan({
      name: merged.name,
      code: merged.code,
      description: merged.description,
      warehouseId: merged.warehouseId,
      siteIds: merged.siteIds,
      locationIds: merged.locationIds,
      scheduledDate:
        typeof merged.scheduledDate === "string"
          ? merged.scheduledDate
          : merged.scheduledDate.toISOString(),
      scheduleWindow: merged.scheduleWindow,
      firstCountUserId: merged.firstCountUserId,
      secondCountUserId: merged.secondCountUserId,
      notes: merged.notes,
      instructions: merged.instructions,
      countMethod: merged.countMethod,
      locked: dto.locked ?? existing.locked,
      highVariancePlaceholder:
        dto.highVariancePlaceholder ?? existing.highVariancePlaceholder,
      status: merged.status,
    });

    let plan;

    try {
      plan = await this.prisma.$transaction(async (tx) => {
        await tx.stockTakePlanSite.deleteMany({ where: { planId: id } });
        await tx.stockTakePlanLocation.deleteMany({ where: { planId: id } });

        return tx.stockTakePlan.update({
          where: { id },
          data: {
            code: dto.code ?? existing.code,
            name: dto.name ?? existing.name,
            description: dto.description ?? existing.description,
            warehouseId: dto.warehouseId ?? existing.warehouseId,
            scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : existing.scheduledDate,
            scheduleWindow: dto.scheduleWindow ?? existing.scheduleWindow,
            firstCountUserId: dto.firstCountUserId ?? existing.firstCountUserId,
            secondCountUserId: dto.secondCountUserId ?? existing.secondCountUserId,
            notes: dto.notes ?? existing.notes,
            instructions: dto.instructions ?? existing.instructions,
            countMethod: dto.countMethod ?? existing.countMethod,
            locked: dto.locked ?? existing.locked,
            highVariancePlaceholder:
              dto.highVariancePlaceholder ?? existing.highVariancePlaceholder,
            status: dto.status ?? existing.status,
            sites: {
              create: (dto.siteIds ?? existing.sites.map((item) => item.siteId)).map((siteId) => ({
                siteId,
              })),
            },
            locations: {
              create: (dto.locationIds ?? existing.locations.map((item) => item.locationId)).map(
                (locationId) => ({ locationId }),
              ),
            },
          },
          include: {
            sites: true,
            locations: true,
          },
        });
      });
    } catch (error) {
      this.handleConstraintError(error);
      throw error;
    }

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "UPDATE_STOCK_TAKE_PLAN",
      entityType: "STOCK_TAKE_PLAN",
      entityId: plan.id,
      metadata: {
        warehouseId: plan.warehouseId,
        siteIds: plan.sites.map((item) => item.siteId),
        locationIds: plan.locations.map((item) => item.locationId),
        firstCountUserId: plan.firstCountUserId,
        secondCountUserId: plan.secondCountUserId,
      },
    });

    return this.toPlanResponse(plan);
  }

  private async validatePlan(dto: {
    warehouseId: string;
    siteIds: string[];
    locationIds: string[];
    firstCountUserId: string;
    secondCountUserId: string;
  }) {
    if (!dto.warehouseId) {
      throw new BadRequestException("Warehouse is required");
    }

    if (!dto.siteIds.length) {
      throw new BadRequestException("At least one site is required");
    }

    if (!dto.locationIds.length) {
      throw new BadRequestException("At least one location is required");
    }

    if (!dto.firstCountUserId || !dto.secondCountUserId) {
      throw new BadRequestException("Both first and second count users are required");
    }

    if (dto.firstCountUserId === dto.secondCountUserId) {
      throw new BadRequestException(
        "First count user and second count user cannot be the same",
      );
    }

    const [warehouse, sites, locations, countUsers] = await Promise.all([
      this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } }),
      this.prisma.site.findMany({
        where: {
          id: { in: dto.siteIds },
          warehouseId: dto.warehouseId,
        },
      }),
      this.prisma.location.findMany({
        where: {
          id: { in: dto.locationIds },
          warehouseId: dto.warehouseId,
          siteId: { in: dto.siteIds },
        },
      }),
      this.prisma.user.findMany({
        where: {
          id: { in: [dto.firstCountUserId, dto.secondCountUserId] },
          status: "active",
        },
        include: { role: true },
      }),
    ]);

    if (!warehouse) {
      throw new BadRequestException("Warehouse not found");
    }

    if (sites.length !== dto.siteIds.length) {
      throw new BadRequestException(
        "One or more selected sites do not belong to the selected warehouse",
      );
    }

    if (locations.length !== dto.locationIds.length) {
      throw new BadRequestException(
        "One or more selected locations do not belong to the selected site scope",
      );
    }

    if (countUsers.length !== 2) {
      throw new BadRequestException("Assigned count users are invalid or inactive");
    }

    if (
      countUsers.some(
        (user) =>
          ![ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER].includes(
            user.role.code as string,
          ),
      )
    ) {
      throw new BadRequestException("Assigned count users have unsupported roles");
    }
  }

  private toPlanResponse(plan: {
    id: string;
    code: string;
    name: string;
    description: string;
    warehouseId: string;
    scheduledDate: Date;
    scheduleWindow: string;
    firstCountUserId: string;
    secondCountUserId: string;
    notes: string;
    instructions: string;
    countMethod: string;
    locked: boolean;
    highVariancePlaceholder: boolean;
    status: string;
    sites: Array<{ siteId: string }>;
    locations: Array<{ locationId: string }>;
  }) {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      warehouseId: plan.warehouseId,
      siteIds: plan.sites.map((item) => item.siteId),
      locationIds: plan.locations.map((item) => item.locationId),
      scheduledDate: plan.scheduledDate.toISOString().slice(0, 10),
      scheduleWindow: plan.scheduleWindow,
      firstCountUserId: plan.firstCountUserId,
      secondCountUserId: plan.secondCountUserId,
      notes: plan.notes,
      instructions: plan.instructions,
      countMethod: plan.countMethod,
      locked: plan.locked,
      highVariancePlaceholder: plan.highVariancePlaceholder,
      status: plan.status,
    };
  }

  private buildAccessWhere(actor?: CurrentUserPayload) {
    if (!actor || actor.role !== ROLE_CODES.WAREHOUSE_USER) {
      return {};
    }

    return {
      warehouseId: { in: actor.warehouseIds },
      sites: {
        some: {
          siteId: { in: actor.siteIds },
        },
      },
    };
  }

  private assertPlanAccess(
    plan: {
      warehouseId: string;
      sites: Array<{ siteId: string }>;
    },
    actor?: CurrentUserPayload,
  ) {
    if (!actor || actor.role !== ROLE_CODES.WAREHOUSE_USER) {
      return;
    }

    const withinWarehouse = actor.warehouseIds.includes(plan.warehouseId);
    const withinSiteScope = plan.sites.some((site) => actor.siteIds.includes(site.siteId));

    if (!withinWarehouse || !withinSiteScope) {
      throw new ForbiddenException("You do not have access to this stock take plan");
    }
  }

  private handleConstraintError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes("code")
    ) {
      throw new BadRequestException("A stock take plan with this code already exists");
    }
  }
}
