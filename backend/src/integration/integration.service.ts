import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  ImportJobStatus,
  ImportRecordStatus,
  ImportType,
  Prisma,
} from "@prisma/client";
import { AuditLogService } from "src/audit-log/audit-log.service";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { QueryImportJobsDto } from "./dto/import-common.dto";
import { ImportItemBarcodesDto, ImportItemBarcodeRecordDto } from "./dto/import-item-barcode.dto";
import { ImportItemsDto, ImportItemRecordDto } from "./dto/import-item.dto";
import { ImportItemUomsDto, ImportItemUomRecordDto } from "./dto/import-item-uom.dto";
import { ImportLocationsDto, ImportLocationRecordDto } from "./dto/import-location.dto";
import { ImportSitesDto, ImportSiteRecordDto } from "./dto/import-site.dto";
import { ImportStockSnapshotsDto, ImportStockSnapshotRecordDto } from "./dto/import-stock-snapshot.dto";
import { ImportWarehousesDto, ImportWarehouseRecordDto } from "./dto/import-warehouse.dto";

type RecordOutcome = {
  status: ImportRecordStatus;
  message?: string;
  externalKey?: string;
  payload?: Record<string, unknown>;
};

@Injectable()
export class IntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listJobs(query: QueryImportJobsDto) {
    const jobs = await this.prisma.importJob.findMany({
      where: query.importType ? { importType: query.importType as ImportType } : undefined,
      take: Math.min(query.limit ?? 12, 50),
      orderBy: { startedAt: "desc" },
      include: {
        details: {
          where: { status: ImportRecordStatus.FAILED },
          orderBy: { recordIndex: "asc" },
          take: 5,
        },
      },
    });

    const latestSnapshotImport = jobs.find((job) => job.importType === ImportType.STOCK_SNAPSHOT) ?? null;

    return {
      jobs: jobs.map((job) => ({
        id: job.id,
        importType: job.importType,
        sourceSystem: job.sourceSystem,
        sourceLabel: job.sourceLabel,
        status: job.status,
        totalRecords: job.totalRecords,
        insertedCount: job.insertedCount,
        updatedCount: job.updatedCount,
        skippedCount: job.skippedCount,
        failedCount: job.failedCount,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        sampleErrors: job.details.map((detail) => ({
          recordIndex: detail.recordIndex,
          externalKey: detail.externalKey,
          message: detail.message,
        })),
      })),
      latestSnapshotImport: latestSnapshotImport
        ? {
            id: latestSnapshotImport.id,
            status: latestSnapshotImport.status,
            startedAt: latestSnapshotImport.startedAt,
            completedAt: latestSnapshotImport.completedAt,
            totalRecords: latestSnapshotImport.totalRecords,
            insertedCount: latestSnapshotImport.insertedCount,
            updatedCount: latestSnapshotImport.updatedCount,
            skippedCount: latestSnapshotImport.skippedCount,
            failedCount: latestSnapshotImport.failedCount,
          }
        : null,
    };
  }

  async getJob(id: string) {
    const job = await this.prisma.importJob.findUnique({
      where: { id },
      include: {
        details: { orderBy: { recordIndex: "asc" } },
      },
    });

    if (!job) {
      throw new NotFoundException("Import job not found");
    }

    return job;
  }

  async importWarehouses(dto: ImportWarehousesDto, actor?: CurrentUserPayload) {
    return this.runImport({
      importType: ImportType.WAREHOUSE,
      sourceSystem: dto.sourceSystem ?? "QAD",
      sourceLabel: dto.sourceLabel,
      records: dto.records,
      actor,
      handler: (record) => this.upsertWarehouse(record),
    });
  }

  async importSites(dto: ImportSitesDto, actor?: CurrentUserPayload) {
    return this.runImport({
      importType: ImportType.SITE,
      sourceSystem: dto.sourceSystem ?? "QAD",
      sourceLabel: dto.sourceLabel,
      records: dto.records,
      actor,
      handler: (record) => this.upsertSite(record),
    });
  }

  async importLocations(dto: ImportLocationsDto, actor?: CurrentUserPayload) {
    return this.runImport({
      importType: ImportType.LOCATION,
      sourceSystem: dto.sourceSystem ?? "QAD",
      sourceLabel: dto.sourceLabel,
      records: dto.records,
      actor,
      handler: (record) => this.upsertLocation(record),
    });
  }

  async importItems(dto: ImportItemsDto, actor?: CurrentUserPayload) {
    return this.runImport({
      importType: ImportType.ITEM,
      sourceSystem: dto.sourceSystem ?? "QAD",
      sourceLabel: dto.sourceLabel,
      records: dto.records,
      actor,
      handler: (record) => this.upsertItem(record),
    });
  }

  async importItemBarcodes(dto: ImportItemBarcodesDto, actor?: CurrentUserPayload) {
    return this.runImport({
      importType: ImportType.ITEM_BARCODE,
      sourceSystem: dto.sourceSystem ?? "QAD",
      sourceLabel: dto.sourceLabel,
      records: dto.records,
      actor,
      handler: (record) => this.upsertItemBarcode(record),
    });
  }

  async importItemUoms(dto: ImportItemUomsDto, actor?: CurrentUserPayload) {
    return this.runImport({
      importType: ImportType.ITEM_UOM,
      sourceSystem: dto.sourceSystem ?? "QAD",
      sourceLabel: dto.sourceLabel,
      records: dto.records,
      actor,
      handler: (record) => this.upsertItemUom(record),
    });
  }

  async importStockSnapshots(dto: ImportStockSnapshotsDto, actor?: CurrentUserPayload) {
    return this.runImport({
      importType: ImportType.STOCK_SNAPSHOT,
      sourceSystem: dto.sourceSystem ?? "QAD",
      sourceLabel: dto.sourceLabel,
      records: dto.records,
      actor,
      handler: (record) => this.upsertStockSnapshot(record),
    });
  }

  private async runImport<TRecord extends Record<string, unknown>>(params: {
    importType: ImportType;
    sourceSystem: string;
    sourceLabel?: string;
    records: TRecord[];
    actor?: CurrentUserPayload;
    handler: (record: TRecord, index: number) => Promise<RecordOutcome>;
  }) {
    if (!params.records.length) {
      throw new BadRequestException("At least one record is required for import.");
    }

    const job = await this.prisma.importJob.create({
      data: {
        importType: params.importType,
        sourceSystem: params.sourceSystem,
        sourceLabel: params.sourceLabel ?? null,
        status: ImportJobStatus.RUNNING,
        totalRecords: params.records.length,
        actorUserId: params.actor?.sub ?? null,
      },
    });

    await this.auditLogService.log({
      actorUserId: params.actor?.sub,
      action: "IMPORT_START",
      entityType: "INTEGRATION",
      entityId: job.id,
      metadata: {
        importType: params.importType,
        sourceSystem: params.sourceSystem,
        totalRecords: params.records.length,
      },
    });

    const details: Prisma.ImportJobDetailCreateManyInput[] = [];
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (let index = 0; index < params.records.length; index += 1) {
      const record = params.records[index];

      try {
        const outcome = await params.handler(record, index);
        if (outcome.status === ImportRecordStatus.INSERTED) insertedCount += 1;
        if (outcome.status === ImportRecordStatus.UPDATED) updatedCount += 1;
        if (outcome.status === ImportRecordStatus.SKIPPED) skippedCount += 1;
        if (outcome.status === ImportRecordStatus.FAILED) failedCount += 1;

        if (outcome.status === ImportRecordStatus.FAILED || outcome.status === ImportRecordStatus.SKIPPED) {
          details.push({
            importJobId: job.id,
            recordIndex: index,
            externalKey: outcome.externalKey ?? null,
            status: outcome.status,
            message: outcome.message ?? null,
            payload: this.toJsonValue(outcome.payload ?? record),
          });
        }
      } catch (error) {
        failedCount += 1;
        details.push({
          importJobId: job.id,
          recordIndex: index,
          externalKey: this.getExternalKey(params.importType, record),
          status: ImportRecordStatus.FAILED,
          message: error instanceof Error ? error.message : "Unknown import error",
          payload: this.toJsonValue(record),
        });
      }
    }

    if (details.length) {
      await this.prisma.importJobDetail.createMany({ data: details });
    }

    const status =
      failedCount === params.records.length
        ? ImportJobStatus.FAILED
        : failedCount > 0
          ? ImportJobStatus.PARTIAL_SUCCESS
          : ImportJobStatus.SUCCESS;

    const updatedJob = await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status,
        insertedCount,
        updatedCount,
        skippedCount,
        failedCount,
        completedAt: new Date(),
      },
      include: {
        details: {
          orderBy: { recordIndex: "asc" },
          take: 20,
        },
      },
    });

    await this.auditLogService.log({
      actorUserId: params.actor?.sub,
      action:
        status === ImportJobStatus.SUCCESS
          ? "IMPORT_SUCCESS"
          : status === ImportJobStatus.PARTIAL_SUCCESS
            ? "IMPORT_PARTIAL_FAILURE"
            : "IMPORT_FAILURE",
      entityType: "INTEGRATION",
      entityId: job.id,
      metadata: {
        importType: params.importType,
        sourceSystem: params.sourceSystem,
        insertedCount,
        updatedCount,
        skippedCount,
        failedCount,
      },
    });

    if (params.importType === ImportType.STOCK_SNAPSHOT) {
      await this.auditLogService.log({
        actorUserId: params.actor?.sub,
        action: "STOCK_SNAPSHOT_IMPORT",
        entityType: "INTEGRATION",
        entityId: job.id,
        metadata: {
          status,
          totalRecords: params.records.length,
        },
      });
    }

    return {
      jobId: updatedJob.id,
      importType: updatedJob.importType,
      sourceSystem: updatedJob.sourceSystem,
      sourceLabel: updatedJob.sourceLabel,
      status: updatedJob.status,
      totalRecords: updatedJob.totalRecords,
      insertedCount: updatedJob.insertedCount,
      updatedCount: updatedJob.updatedCount,
      skippedCount: updatedJob.skippedCount,
      failedCount: updatedJob.failedCount,
      startedAt: updatedJob.startedAt,
      completedAt: updatedJob.completedAt,
      errors: updatedJob.details.map((detail) => ({
        recordIndex: detail.recordIndex,
        externalKey: detail.externalKey,
        status: detail.status,
        message: detail.message,
      })),
    };
  }

  private async upsertWarehouse(record: ImportWarehouseRecordDto): Promise<RecordOutcome> {
    const existing = await this.prisma.warehouse.findUnique({
      where: { code: record.code },
    });

    const nextValues = {
      name: record.name,
      city: record.city,
      region: record.region,
      status: record.status ?? "active",
    };

    if (!existing) {
      await this.prisma.warehouse.create({
        data: {
          code: record.code,
          ...nextValues,
        },
      });
      return { status: ImportRecordStatus.INSERTED, externalKey: record.code };
    }

    if (!this.hasDifferences(existing, nextValues)) {
      return { status: ImportRecordStatus.SKIPPED, externalKey: record.code, message: "Warehouse already up to date." };
    }

    await this.prisma.warehouse.update({
      where: { id: existing.id },
      data: nextValues,
    });
    return { status: ImportRecordStatus.UPDATED, externalKey: record.code };
  }

  private async upsertSite(record: ImportSiteRecordDto): Promise<RecordOutcome> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { code: record.warehouseCode },
    });

    if (!warehouse) {
      throw new BadRequestException(`Warehouse ${record.warehouseCode} does not exist.`);
    }

    const existing = await this.prisma.site.findUnique({
      where: {
        warehouseId_code: {
          warehouseId: warehouse.id,
          code: record.code,
        },
      },
    });

    const nextValues = {
      name: record.name,
      type: record.type,
      manager: record.manager,
      status: record.status ?? "active",
    };

    if (!existing) {
      await this.prisma.site.create({
        data: {
          warehouseId: warehouse.id,
          code: record.code,
          ...nextValues,
        },
      });
      return { status: ImportRecordStatus.INSERTED, externalKey: `${record.warehouseCode}:${record.code}` };
    }

    if (!this.hasDifferences(existing, nextValues)) {
      return {
        status: ImportRecordStatus.SKIPPED,
        externalKey: `${record.warehouseCode}:${record.code}`,
        message: "Site already up to date.",
      };
    }

    await this.prisma.site.update({
      where: { id: existing.id },
      data: nextValues,
    });
    return { status: ImportRecordStatus.UPDATED, externalKey: `${record.warehouseCode}:${record.code}` };
  }

  private async upsertLocation(record: ImportLocationRecordDto): Promise<RecordOutcome> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { code: record.warehouseCode },
    });
    if (!warehouse) {
      throw new BadRequestException(`Warehouse ${record.warehouseCode} does not exist.`);
    }

    const site = await this.prisma.site.findUnique({
      where: {
        warehouseId_code: {
          warehouseId: warehouse.id,
          code: record.siteCode,
        },
      },
    });
    if (!site) {
      throw new BadRequestException(`Site ${record.siteCode} does not exist under warehouse ${record.warehouseCode}.`);
    }

    const existing =
      (await this.prisma.location.findUnique({
        where: {
          siteId_code: {
            siteId: site.id,
            code: record.code,
          },
        },
      })) ??
      (await this.prisma.location.findUnique({
        where: { barcode: record.barcode },
      }));

    const nextValues = {
      warehouseId: warehouse.id,
      siteId: site.id,
      name: record.name,
      aisle: record.aisle,
      zone: record.zone,
      barcode: record.barcode,
      status: record.status ?? "active",
    };

    if (!existing) {
      await this.prisma.location.create({
        data: {
          code: record.code,
          ...nextValues,
        },
      });
      return {
        status: ImportRecordStatus.INSERTED,
        externalKey: `${record.warehouseCode}:${record.siteCode}:${record.code}`,
      };
    }

    if (existing.siteId !== site.id && existing.barcode === record.barcode) {
      throw new BadRequestException(`Barcode ${record.barcode} is already assigned to another location.`);
    }

    if (!this.hasDifferences(existing, { code: record.code, ...nextValues })) {
      return {
        status: ImportRecordStatus.SKIPPED,
        externalKey: `${record.warehouseCode}:${record.siteCode}:${record.code}`,
        message: "Location already up to date.",
      };
    }

    await this.prisma.location.update({
      where: { id: existing.id },
      data: {
        code: record.code,
        ...nextValues,
      },
    });
    return {
      status: ImportRecordStatus.UPDATED,
      externalKey: `${record.warehouseCode}:${record.siteCode}:${record.code}`,
    };
  }

  private async upsertItem(record: ImportItemRecordDto): Promise<RecordOutcome> {
    const existing = await this.prisma.item.findUnique({ where: { code: record.code } });
    const nextValues = {
      description: record.description,
      status: record.status ?? "active",
    };

    if (!existing) {
      await this.prisma.item.create({ data: { code: record.code, ...nextValues } });
      return { status: ImportRecordStatus.INSERTED, externalKey: record.code };
    }

    if (!this.hasDifferences(existing, nextValues)) {
      return { status: ImportRecordStatus.SKIPPED, externalKey: record.code, message: "Item already up to date." };
    }

    await this.prisma.item.update({
      where: { id: existing.id },
      data: nextValues,
    });
    return { status: ImportRecordStatus.UPDATED, externalKey: record.code };
  }

  private async upsertItemBarcode(record: ImportItemBarcodeRecordDto): Promise<RecordOutcome> {
    const item = await this.prisma.item.findUnique({
      where: { code: record.itemCode },
    });
    if (!item) {
      throw new BadRequestException(`Item ${record.itemCode} does not exist.`);
    }

    const existing = await this.prisma.itemBarcode.findUnique({
      where: { barcode: record.barcode },
    });
    const nextValues = {
      itemId: item.id,
      uomCode: record.uomCode ?? null,
      isPrimary: record.isPrimary ?? false,
    };

    if (!existing) {
      await this.prisma.itemBarcode.create({
        data: {
          barcode: record.barcode,
          ...nextValues,
        },
      });
      return { status: ImportRecordStatus.INSERTED, externalKey: record.barcode };
    }

    if (!this.hasDifferences(existing, nextValues)) {
      return { status: ImportRecordStatus.SKIPPED, externalKey: record.barcode, message: "Barcode mapping already up to date." };
    }

    await this.prisma.itemBarcode.update({
      where: { id: existing.id },
      data: nextValues,
    });
    return { status: ImportRecordStatus.UPDATED, externalKey: record.barcode };
  }

  private async upsertItemUom(record: ImportItemUomRecordDto): Promise<RecordOutcome> {
    const item = await this.prisma.item.findUnique({
      where: { code: record.itemCode },
    });
    if (!item) {
      throw new BadRequestException(`Item ${record.itemCode} does not exist.`);
    }

    const existing = await this.prisma.itemUOM.findUnique({
      where: {
        itemId_uomCode: {
          itemId: item.id,
          uomCode: record.uomCode,
        },
      },
    });

    const nextValues = {
      conversionFactor: new Prisma.Decimal(record.conversionFactor),
      isBase: record.isBase ?? false,
    };

    if (!existing) {
      await this.prisma.itemUOM.create({
        data: {
          itemId: item.id,
          uomCode: record.uomCode,
          ...nextValues,
        },
      });
      return { status: ImportRecordStatus.INSERTED, externalKey: `${record.itemCode}:${record.uomCode}` };
    }

    const existingComparable = {
      conversionFactor: Number(existing.conversionFactor),
      isBase: existing.isBase,
    };
    const nextComparable = {
      conversionFactor: record.conversionFactor,
      isBase: record.isBase ?? false,
    };

    if (!this.hasDifferences(existingComparable, nextComparable)) {
      return {
        status: ImportRecordStatus.SKIPPED,
        externalKey: `${record.itemCode}:${record.uomCode}`,
        message: "Item UOM already up to date.",
      };
    }

    await this.prisma.itemUOM.update({
      where: { id: existing.id },
      data: nextValues,
    });
    return { status: ImportRecordStatus.UPDATED, externalKey: `${record.itemCode}:${record.uomCode}` };
  }

  private async upsertStockSnapshot(record: ImportStockSnapshotRecordDto): Promise<RecordOutcome> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { code: record.warehouseCode },
    });
    if (!warehouse) {
      throw new BadRequestException(`Warehouse ${record.warehouseCode} does not exist.`);
    }

    const site = await this.prisma.site.findUnique({
      where: {
        warehouseId_code: {
          warehouseId: warehouse.id,
          code: record.siteCode,
        },
      },
    });
    if (!site) {
      throw new BadRequestException(`Site ${record.siteCode} does not exist under warehouse ${record.warehouseCode}.`);
    }

    const location = await this.prisma.location.findUnique({
      where: {
        siteId_code: {
          siteId: site.id,
          code: record.locationCode,
        },
      },
    });
    if (!location || location.warehouseId !== warehouse.id) {
      throw new BadRequestException(`Location ${record.locationCode} is not valid for site ${record.siteCode}.`);
    }

    const item = await this.prisma.item.findUnique({
      where: { code: record.itemCode },
    });
    if (!item) {
      throw new BadRequestException(`Item ${record.itemCode} does not exist.`);
    }

    const itemUom = await this.prisma.itemUOM.findUnique({
      where: {
        itemId_uomCode: {
          itemId: item.id,
          uomCode: record.uomCode,
        },
      },
    });
    if (!itemUom) {
      throw new BadRequestException(`UOM ${record.uomCode} does not exist for item ${record.itemCode}.`);
    }

    const snapshotAt = new Date(record.snapshotAt);
    const uniqueKey = {
      warehouseId_siteId_locationId_itemId_itemUomId_snapshotAt: {
        warehouseId: warehouse.id,
        siteId: site.id,
        locationId: location.id,
        itemId: item.id,
        itemUomId: itemUom.id,
        snapshotAt,
      },
    };
    const existing = await this.prisma.stockSnapshot.findUnique({
      where: uniqueKey,
    });

    const nextValues = {
      quantity: new Prisma.Decimal(record.quantity),
      sourceReference: record.sourceReference ?? null,
    };

    if (!existing) {
      await this.prisma.stockSnapshot.create({
        data: {
          warehouseId: warehouse.id,
          siteId: site.id,
          locationId: location.id,
          itemId: item.id,
          itemUomId: itemUom.id,
          snapshotAt,
          ...nextValues,
        },
      });
      return {
        status: ImportRecordStatus.INSERTED,
        externalKey: `${record.locationCode}:${record.itemCode}:${record.uomCode}:${record.snapshotAt}`,
      };
    }

    const existingComparable = {
      quantity: Number(existing.quantity),
      sourceReference: existing.sourceReference ?? null,
    };
    const nextComparable = {
      quantity: record.quantity,
      sourceReference: record.sourceReference ?? null,
    };

    if (!this.hasDifferences(existingComparable, nextComparable)) {
      return {
        status: ImportRecordStatus.SKIPPED,
        externalKey: `${record.locationCode}:${record.itemCode}:${record.uomCode}:${record.snapshotAt}`,
        message: "Stock snapshot already imported.",
      };
    }

    await this.prisma.stockSnapshot.update({
      where: { id: existing.id },
      data: nextValues,
    });
    return {
      status: ImportRecordStatus.UPDATED,
      externalKey: `${record.locationCode}:${record.itemCode}:${record.uomCode}:${record.snapshotAt}`,
    };
  }

  private hasDifferences(
    current: Record<string, unknown>,
    next: Record<string, unknown>,
  ) {
    return Object.entries(next).some(([key, value]) => current[key] !== value);
  }

  private getExternalKey(importType: ImportType, record: Record<string, unknown>) {
    if (importType === ImportType.WAREHOUSE) return String(record.code ?? "");
    if (importType === ImportType.SITE) return `${record.warehouseCode ?? ""}:${record.code ?? ""}`;
    if (importType === ImportType.LOCATION) {
      return `${record.warehouseCode ?? ""}:${record.siteCode ?? ""}:${record.code ?? ""}`;
    }
    if (importType === ImportType.ITEM) return String(record.code ?? "");
    if (importType === ImportType.ITEM_BARCODE) return String(record.barcode ?? "");
    if (importType === ImportType.ITEM_UOM) return `${record.itemCode ?? ""}:${record.uomCode ?? ""}`;
    return `${record.locationCode ?? ""}:${record.itemCode ?? ""}:${record.uomCode ?? ""}`;
  }

  private toJsonValue(value: Record<string, unknown>) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
