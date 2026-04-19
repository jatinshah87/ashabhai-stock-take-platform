import { Injectable } from "@nestjs/common";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MasterDataService {
  constructor(private readonly prisma: PrismaService) {}

  listWarehouses(user?: CurrentUserPayload) {
    return this.prisma.warehouse.findMany({
      where: this.isWarehouseUser(user)
        ? {
            id: { in: user?.warehouseIds ?? [] },
          }
        : undefined,
      orderBy: { name: "asc" },
    });
  }

  listSitesByWarehouse(warehouseId: string, user?: CurrentUserPayload) {
    return this.prisma.site.findMany({
      where: {
        warehouseId,
        ...(this.isWarehouseUser(user)
          ? {
              id: { in: user?.siteIds ?? [] },
            }
          : {}),
      },
      orderBy: { code: "asc" },
    });
  }

  listLocationsBySite(siteId: string, user?: CurrentUserPayload) {
    return this.prisma.location.findMany({
      where: {
        ...(this.isWarehouseUser(user)
          ? {
              warehouseId: { in: user?.warehouseIds ?? [] },
              siteId: {
                in: (user?.siteIds ?? []).includes(siteId) ? [siteId] : [],
              },
            }
          : { siteId }),
      },
      orderBy: { code: "asc" },
    });
  }

  listHierarchy(user?: CurrentUserPayload) {
    return this.prisma.warehouse.findMany({
      where: this.isWarehouseUser(user)
        ? {
            id: { in: user?.warehouseIds ?? [] },
          }
        : undefined,
      orderBy: { name: "asc" },
      include: {
        sites: {
          where: this.isWarehouseUser(user)
            ? {
                id: { in: user?.siteIds ?? [] },
              }
            : undefined,
          orderBy: { code: "asc" },
          include: {
            locations: {
              orderBy: { code: "asc" },
            },
          },
        },
      },
    });
  }

  private isWarehouseUser(user?: CurrentUserPayload) {
    return user?.role === ROLE_CODES.WAREHOUSE_USER;
  }
}
