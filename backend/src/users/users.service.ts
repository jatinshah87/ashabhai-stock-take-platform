import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { AuditLogService } from "src/audit-log/audit-log.service";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUsersDto } from "./dto/query-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async list(dto: QueryUsersDto, actor?: CurrentUserPayload) {
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          dto.search
            ? {
                OR: [
                  { name: { contains: dto.search, mode: "insensitive" } },
                  { email: { contains: dto.search, mode: "insensitive" } },
                  { employeeCode: { contains: dto.search, mode: "insensitive" } },
                ],
              }
            : {},
          dto.status ? { status: dto.status } : {},
          dto.warehouseId ? { warehouseAccesses: { some: { warehouseId: dto.warehouseId } } } : {},
          dto.siteId ? { siteAccesses: { some: { siteId: dto.siteId } } } : {},
          dto.role ? { role: { code: this.mapFrontendRoleToCode(dto.role) } } : {},
          this.buildAccessWhere(actor),
        ],
      },
      include: {
        role: true,
        warehouseAccesses: true,
        siteAccesses: true,
      },
      orderBy: { name: "asc" },
    });

    return users.map((user) => this.toUserResponse(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        warehouseAccesses: true,
        siteAccesses: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.toUserResponse(user);
  }

  async create(dto: CreateUserDto, actor?: CurrentUserPayload) {
    await this.validateAssignments(dto.warehouseId, dto.siteIds);

    const role = await this.prisma.role.findUnique({
      where: { code: this.mapFrontendRoleToCode(dto.role) },
    });

    if (!role) {
      throw new BadRequestException("Role not found");
    }

    const passwordHash = await hash(process.env.DEFAULT_USER_PASSWORD ?? "ChangeMe@123", 10);

    let user;

    try {
      user = await this.prisma.user.create({
        data: {
          employeeCode: dto.employeeCode,
          name: dto.name,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          passwordHash,
          status: dto.status ?? "active",
          roleId: role.id,
          warehouseAccesses: {
            create: [{ warehouseId: dto.warehouseId }],
          },
          siteAccesses: {
            create: dto.siteIds.map((siteId) => ({ siteId })),
          },
        },
        include: {
          role: true,
          warehouseAccesses: true,
          siteAccesses: true,
        },
      });
    } catch (error) {
      this.handleConstraintError(error);
      throw error;
    }

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "CREATE_USER",
      entityType: "USER",
      entityId: user.id,
      metadata: {
        role: dto.role,
        warehouseId: dto.warehouseId,
        siteIds: dto.siteIds,
      },
    });

    return this.toUserResponse(user);
  }

  async update(id: string, dto: UpdateUserDto, actor?: CurrentUserPayload) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        warehouseAccesses: true,
        siteAccesses: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const warehouseId = dto.warehouseId ?? existing.warehouseAccesses[0]?.warehouseId;
    const siteIds = dto.siteIds ?? existing.siteAccesses.map((access) => access.siteId);
    await this.validateAssignments(warehouseId, siteIds);

    const roleCode = dto.role ? this.mapFrontendRoleToCode(dto.role) : existing.role.code;
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) {
      throw new BadRequestException("Role not found");
    }

    let user;

    try {
      user = await this.prisma.$transaction(async (tx) => {
        await tx.userWarehouseAccess.deleteMany({ where: { userId: id } });
        await tx.userSiteAccess.deleteMany({ where: { userId: id } });

        return tx.user.update({
          where: { id },
          data: {
            employeeCode: dto.employeeCode ?? existing.employeeCode,
            name: dto.name ?? existing.name,
            email: dto.email?.toLowerCase() ?? existing.email,
            phone: dto.phone ?? existing.phone,
            status: dto.status ?? existing.status,
            roleId: role.id,
            warehouseAccesses: {
              create: warehouseId ? [{ warehouseId }] : [],
            },
            siteAccesses: {
              create: siteIds.map((siteId) => ({ siteId })),
            },
          },
          include: {
            role: true,
            warehouseAccesses: true,
            siteAccesses: true,
          },
        });
      });
    } catch (error) {
      this.handleConstraintError(error);
      throw error;
    }

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "UPDATE_USER",
      entityType: "USER",
      entityId: user.id,
      metadata: {
        role: dto.role ?? this.mapRoleCodeToFrontend(existing.role.code),
        warehouseId,
        siteIds,
      },
    });

    return this.toUserResponse(user);
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, actor?: CurrentUserPayload) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      include: {
        role: true,
        warehouseAccesses: true,
        siteAccesses: true,
      },
    });

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: dto.status === "active" ? "REACTIVATE_USER" : "DEACTIVATE_USER",
      entityType: "USER",
      entityId: user.id,
      metadata: { status: dto.status },
    });

    return this.toUserResponse(user);
  }

  private async validateAssignments(warehouseId: string | undefined, siteIds: string[]) {
    if (!warehouseId) {
      throw new BadRequestException("Warehouse assignment is required");
    }

    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) {
      throw new BadRequestException("Warehouse not found");
    }

    if (!siteIds.length) {
      throw new BadRequestException("At least one site must be assigned");
    }

    const validSites = await this.prisma.site.findMany({
      where: {
        id: { in: siteIds },
        warehouseId,
      },
    });

    if (validSites.length !== siteIds.length) {
      throw new BadRequestException("One or more assigned sites do not belong to the selected warehouse");
    }
  }

  private mapFrontendRoleToCode(role: "Admin" | "Auditor" | "Warehouse") {
    if (role === "Admin") return ROLE_CODES.SYSTEM_ADMIN;
    if (role === "Auditor") return ROLE_CODES.AUDITOR;
    return ROLE_CODES.WAREHOUSE_USER;
  }

  private mapRoleCodeToFrontend(roleCode: string) {
    if (roleCode === ROLE_CODES.SYSTEM_ADMIN) return "Admin";
    if (roleCode === ROLE_CODES.AUDITOR) return "Auditor";
    return "Warehouse";
  }

  private toUserResponse(user: {
    id: string;
    employeeCode: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    role: { code: string };
    warehouseAccesses: Array<{ warehouseId: string }>;
    siteAccesses: Array<{ siteId: string }>;
  }) {
    return {
      id: user.id,
      employeeCode: user.employeeCode,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: this.mapRoleCodeToFrontend(user.role.code),
      warehouseId: user.warehouseAccesses[0]?.warehouseId ?? "",
      siteIds: user.siteAccesses.map((access) => access.siteId),
      status: user.status,
    };
  }

  private buildAccessWhere(actor?: CurrentUserPayload) {
    if (!actor || actor.role !== ROLE_CODES.WAREHOUSE_USER) {
      return {};
    }

    return {
      status: "active",
      warehouseAccesses: {
        some: {
          warehouseId: { in: actor.warehouseIds },
        },
      },
      siteAccesses: {
        some: {
          siteId: { in: actor.siteIds },
        },
      },
    };
  }

  private handleConstraintError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target)
    ) {
      if (error.meta.target.includes("email")) {
        throw new BadRequestException("A user with this email already exists");
      }

      if (error.meta.target.includes("employeeCode")) {
        throw new BadRequestException("This employee code is already in use");
      }
    }
  }
}
