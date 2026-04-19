import { Injectable, NotFoundException } from "@nestjs/common";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { QueryItemsDto } from "./dto/query-items.dto";
import { QuerySnapshotsDto } from "./dto/query-snapshots.dto";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listItems(query: QueryItemsDto) {
    const items = await this.prisma.item.findMany({
      where: {
        AND: [
          query.search
            ? {
                OR: [
                  { code: { contains: query.search, mode: "insensitive" } },
                  { description: { contains: query.search, mode: "insensitive" } },
                  { barcodes: { some: { barcode: { contains: query.search, mode: "insensitive" } } } },
                ],
              }
            : {},
          query.status ? { status: query.status } : {},
        ],
      },
      include: {
        barcodes: true,
        uoms: true,
      },
      orderBy: { code: "asc" },
    });

    return items.map((item) => this.toItemResponse(item));
  }

  async getItemByBarcode(barcode: string) {
    const itemBarcode = await this.prisma.itemBarcode.findUnique({
      where: { barcode },
      include: {
        item: {
          include: {
            barcodes: true,
            uoms: true,
          },
        },
      },
    });

    if (!itemBarcode || itemBarcode.item.status !== "active") {
      throw new NotFoundException("Item barcode not found or inactive");
    }

    return {
      ...this.toItemResponse(itemBarcode.item),
      scannedBarcode: itemBarcode.barcode,
      scannedUomCode: itemBarcode.uomCode,
    };
  }

  async listItemUoms(itemId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { uoms: true },
    });

    if (!item) {
      throw new NotFoundException("Item not found");
    }

    return item.uoms.map((uom) => ({
      id: uom.id,
      uomCode: uom.uomCode,
      conversionFactor: Number(uom.conversionFactor),
      isBase: uom.isBase,
    }));
  }

  async listStockSnapshots(query: QuerySnapshotsDto, actor?: CurrentUserPayload) {
    const snapshots = await this.prisma.stockSnapshot.findMany({
      where: {
        AND: [
          query.planId
            ? {
                locationId: {
                  in: (
                    await this.prisma.stockTakePlanLocation.findMany({
                      where: { planId: query.planId },
                      select: { locationId: true },
                    })
                  ).map((item) => item.locationId),
                },
              }
            : {},
          query.warehouseId ? { warehouseId: query.warehouseId } : {},
          query.siteId ? { siteId: query.siteId } : {},
          query.locationId ? { locationId: query.locationId } : {},
          this.buildAccessWhere(actor),
        ],
      },
      include: {
        item: true,
        itemUom: true,
        location: true,
      },
      orderBy: [{ location: { code: "asc" } }, { item: { code: "asc" } }],
    });

    return snapshots.map((snapshot) => ({
      id: snapshot.id,
      warehouseId: snapshot.warehouseId,
      siteId: snapshot.siteId,
      locationId: snapshot.locationId,
      itemId: snapshot.itemId,
      itemCode: snapshot.item.code,
      itemDescription: snapshot.item.description,
      uomCode: snapshot.itemUom.uomCode,
      quantity: Number(snapshot.quantity),
      snapshotAt: snapshot.snapshotAt.toISOString(),
      locationCode: snapshot.location.code,
    }));
  }

  private toItemResponse(item: {
    id: string;
    code: string;
    description: string;
    status: string;
    barcodes: Array<{ id: string; barcode: string; isPrimary: boolean; uomCode: string | null }>;
    uoms: Array<{ id: string; uomCode: string; conversionFactor: unknown; isBase: boolean }>;
  }) {
    return {
      id: item.id,
      code: item.code,
      description: item.description,
      status: item.status,
      barcodes: item.barcodes.map((barcode) => ({
        id: barcode.id,
        barcode: barcode.barcode,
        isPrimary: barcode.isPrimary,
        uomCode: barcode.uomCode,
      })),
      uoms: item.uoms.map((uom) => ({
        id: uom.id,
        uomCode: uom.uomCode,
        conversionFactor: Number(uom.conversionFactor),
        isBase: uom.isBase,
      })),
    };
  }

  private buildAccessWhere(actor?: CurrentUserPayload) {
    if (!actor || actor.role !== ROLE_CODES.WAREHOUSE_USER) {
      return {};
    }

    return {
      warehouseId: { in: actor.warehouseIds },
      siteId: { in: actor.siteIds },
    };
  }
}
