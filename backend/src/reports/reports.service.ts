import { Injectable } from "@nestjs/common";
import { CountType } from "@prisma/client";
import ExcelJS from "exceljs";
import { AuditLogService } from "src/audit-log/audit-log.service";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { QueryReportDto } from "./dto/query-report.dto";

export type ReportType =
  | "first-vs-second"
  | "system-vs-first"
  | "system-vs-second"
  | "final-variance";

type BaseComparisonRow = {
  planId: string;
  planCode: string;
  warehouse: string;
  site: string;
  location: string;
  itemCode: string;
  itemDescription: string;
  uom: string;
  systemQty: number;
  firstQty: number;
  secondQty: number;
  firstVarianceQty: number;
  firstVariancePercent: number;
  secondVarianceQty: number;
  secondVariancePercent: number;
  betweenCountsQty: number;
  betweenCountsPercent: number;
  finalVarianceQty: number;
  finalVariancePercent: number;
  severity: "matched" | "low" | "medium" | "high";
  status: string;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getReport(type: ReportType, query: QueryReportDto, actor?: CurrentUserPayload) {
    const rows = await this.buildRows(type, query, actor);
    const summary = this.buildSummary(rows, type);

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "GENERATE_REPORT",
      entityType: "REPORT",
      metadata: {
        type,
        filters: query,
        rowCount: rows.length,
      },
    });

    return {
      type,
      summary,
      rows: rows.map((row) => this.projectRow(type, row)),
    };
  }

  async exportReport(type: ReportType, query: QueryReportDto, actor?: CurrentUserPayload) {
    const report = await this.getReport(type, query, actor);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.getSheetName(type));

    const rows = report.rows as Array<Record<string, unknown>>;
    const headers = rows.length ? Object.keys(rows[0]) : this.getDefaultHeaders(type);

    worksheet.columns = headers.map((header) => ({
      header: this.toHeaderLabel(header),
      key: header,
      width: Math.max(16, header.length + 4),
    }));

    rows.forEach((row) => worksheet.addRow(row));
    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${type}-${timestamp}.xlsx`;

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "EXPORT_REPORT",
      entityType: "REPORT",
      metadata: {
        type,
        filters: query,
        filename,
      },
    });

    return { buffer, filename };
  }

  private async buildRows(type: ReportType, query: QueryReportDto, actor?: CurrentUserPayload) {
    const plans = await this.prisma.stockTakePlan.findMany({
      where: {
        AND: [
          query.planId ? { id: query.planId } : {},
          query.warehouseId ? { warehouseId: query.warehouseId } : {},
          actor?.role === ROLE_CODES.WAREHOUSE_USER
            ? {
                warehouseId: { in: actor.warehouseIds },
                OR: [{ firstCountUserId: actor.sub }, { secondCountUserId: actor.sub }],
              }
            : {},
        ],
      },
      include: {
        warehouse: true,
        sites: { include: { site: true } },
        locations: { include: { location: true } },
        countSubmissions: true,
      },
      orderBy: [{ scheduledDate: "asc" }, { code: "asc" }],
    });

    const planIds = plans.map((plan) => plan.id);
    const locationIds = plans.flatMap((plan) => plan.locations.map((item) => item.locationId));
    const [entries, snapshots, items] = await Promise.all([
      this.prisma.countEntry.findMany({
        where: {
          planId: { in: planIds.length ? planIds : ["__none__"] },
        },
        include: {
          location: { include: { site: true, warehouse: true } },
          item: { include: { uoms: true } },
          itemUom: true,
          plan: true,
        },
      }),
      this.prisma.stockSnapshot.findMany({
        where: {
          locationId: { in: locationIds.length ? locationIds : ["__none__"] },
          ...(query.siteId ? { siteId: query.siteId } : {}),
          ...(query.locationId ? { locationId: query.locationId } : {}),
        },
        include: {
          location: { include: { site: true, warehouse: true } },
          item: { include: { uoms: true } },
          itemUom: true,
        },
      }),
      this.prisma.item.findMany({
        where: query.itemId
          ? {
              OR: [
                { id: query.itemId },
                { code: { equals: query.itemId, mode: "insensitive" } },
                { description: { contains: query.itemId, mode: "insensitive" } },
              ],
            }
          : undefined,
        include: { uoms: true },
      }),
    ]);

    const itemMap = new Map(items.map((item) => [item.id, item]));
    const allowedItemIds = query.itemId ? new Set(items.map((item) => item.id)) : null;
    const rowMap = new Map<string, BaseComparisonRow>();

    for (const plan of plans) {
      const scopedLocationIds = new Set(plan.locations.map((item) => item.locationId));
      const scopedSnapshots = snapshots.filter(
        (snapshot) =>
          scopedLocationIds.has(snapshot.locationId) &&
          (!allowedItemIds || allowedItemIds.has(snapshot.itemId)),
      );

      for (const snapshot of scopedSnapshots) {
        const item = itemMap.get(snapshot.itemId) ?? snapshot.item;
        const baseUom = item.uoms.find((uom) => uom.isBase) ?? item.uoms[0];
        const convertedQty =
          Number(snapshot.quantity) * Number(snapshot.itemUom.conversionFactor) / Number(baseUom.conversionFactor);
        const key = `${plan.id}:${snapshot.locationId}:${snapshot.itemId}`;
        const current = rowMap.get(key) ?? {
          planId: plan.id,
          planCode: plan.code,
          warehouse: snapshot.location.warehouse.name,
          site: snapshot.location.site.code,
          location: snapshot.location.code,
          itemCode: item.code,
          itemDescription: item.description,
          uom: baseUom.uomCode,
          systemQty: 0,
          firstQty: 0,
          secondQty: 0,
          firstVarianceQty: 0,
          firstVariancePercent: 0,
          secondVarianceQty: 0,
          secondVariancePercent: 0,
          betweenCountsQty: 0,
          betweenCountsPercent: 0,
          finalVarianceQty: 0,
          finalVariancePercent: 0,
          severity: "matched",
          status: plan.status,
        };
        current.systemQty += convertedQty;
        rowMap.set(key, current);
      }
    }

    for (const entry of entries) {
      const plan = plans.find((item) => item.id === entry.planId);
      if (!plan) continue;
      if (query.siteId && entry.siteId !== query.siteId) continue;
      if (query.locationId && entry.locationId !== query.locationId) continue;
      if (allowedItemIds && !allowedItemIds.has(entry.itemId)) continue;

      const relevantSubmission = plan.countSubmissions.find((submission) => submission.countType === entry.countType);
      if (!relevantSubmission?.submittedAt) {
        continue;
      }

      const item = itemMap.get(entry.itemId) ?? entry.item;
      const baseUom = item.uoms.find((uom) => uom.isBase) ?? item.uoms[0];
      const convertedQty =
        Number(entry.countedQty) * Number(entry.itemUom.conversionFactor) / Number(baseUom.conversionFactor);
      const key = `${plan.id}:${entry.locationId}:${entry.itemId}`;
      const current = rowMap.get(key) ?? {
        planId: plan.id,
        planCode: plan.code,
        warehouse: entry.location.warehouse.name,
        site: entry.location.site.code,
        location: entry.location.code,
        itemCode: item.code,
        itemDescription: item.description,
        uom: baseUom.uomCode,
        systemQty: 0,
        firstQty: 0,
        secondQty: 0,
        firstVarianceQty: 0,
        firstVariancePercent: 0,
        secondVarianceQty: 0,
        secondVariancePercent: 0,
        betweenCountsQty: 0,
        betweenCountsPercent: 0,
        finalVarianceQty: 0,
        finalVariancePercent: 0,
        severity: "matched",
        status: plan.status,
      };
      current.planId = plan.id;
      current.planCode = plan.code;
      current.status = plan.status;
      if (entry.countType === CountType.FIRST) current.firstQty += convertedQty;
      if (entry.countType === CountType.SECOND) current.secondQty += convertedQty;
      rowMap.set(key, current);
    }

    const rows = Array.from(rowMap.values())
      .map((row) => {
        row.firstVarianceQty = row.firstQty - row.systemQty;
        row.firstVariancePercent = this.percent(row.firstVarianceQty, row.systemQty);
        row.secondVarianceQty = row.secondQty - row.systemQty;
        row.secondVariancePercent = this.percent(row.secondVarianceQty, row.systemQty);
        row.betweenCountsQty = row.secondQty - row.firstQty;
        row.betweenCountsPercent = this.percent(row.betweenCountsQty, row.firstQty);
        const finalReference = row.secondQty || row.firstQty;
        row.finalVarianceQty = finalReference - row.systemQty;
        row.finalVariancePercent = this.percent(row.finalVarianceQty, row.systemQty);
        row.severity = this.getSeverity(type, row);
        return row;
      })
      .filter((row) => this.matchesType(type, row, plans))
      .filter((row) => !query.severity || row.severity === query.severity);

    return rows;
  }

  private matchesType(
    type: ReportType,
    row: BaseComparisonRow,
    plans: Array<{
      id: string;
      countSubmissions: Array<{ countType: CountType; submittedAt: Date | null }>;
    }>,
  ) {
    const plan = plans.find((item) => item.id === row.planId);
    const firstSubmitted = Boolean(
      plan?.countSubmissions.find((submission) => submission.countType === CountType.FIRST)?.submittedAt,
    );
    const secondSubmitted = Boolean(
      plan?.countSubmissions.find((submission) => submission.countType === CountType.SECOND)?.submittedAt,
    );

    if (type === "first-vs-second") {
      return firstSubmitted && secondSubmitted && (row.firstQty > 0 || row.secondQty > 0);
    }
    if (type === "system-vs-first") return firstSubmitted && (row.firstQty > 0 || row.systemQty > 0);
    if (type === "system-vs-second") return secondSubmitted && (row.secondQty > 0 || row.systemQty > 0);
    return (firstSubmitted || secondSubmitted) && (row.firstQty > 0 || row.secondQty > 0 || row.systemQty > 0);
  }

  private getSeverity(type: ReportType, row: BaseComparisonRow) {
    const percent =
      type === "first-vs-second"
        ? Math.abs(row.betweenCountsPercent)
        : type === "system-vs-first"
          ? Math.abs(row.firstVariancePercent)
          : type === "system-vs-second"
            ? Math.abs(row.secondVariancePercent)
            : Math.abs(row.finalVariancePercent);
    if (percent === 0) return "matched";
    if (percent >= 10) return "high";
    if (percent >= 5) return "medium";
    return "low";
  }

  private buildSummary(rows: BaseComparisonRow[], type: ReportType) {
    const varianceTotal = rows.reduce((sum, row) => {
      const value =
        type === "first-vs-second"
          ? Math.abs(row.betweenCountsQty)
          : type === "system-vs-first"
            ? Math.abs(row.firstVarianceQty)
            : type === "system-vs-second"
              ? Math.abs(row.secondVarianceQty)
              : Math.abs(row.finalVarianceQty);
      return sum + value;
    }, 0);

    return {
      totalItemsCompared: rows.length,
      totalVarianceQuantity: Number(varianceTotal.toFixed(2)),
      mismatchedItems: rows.filter((row) => row.severity !== "matched").length,
      matchedItems: rows.filter((row) => row.severity === "matched").length,
      highVarianceCount: rows.filter((row) => row.severity === "high").length,
      mediumVarianceCount: rows.filter((row) => row.severity === "medium").length,
      lowVarianceCount: rows.filter((row) => row.severity === "low").length,
    };
  }

  private projectRow(type: ReportType, row: BaseComparisonRow) {
    if (type === "first-vs-second") {
      return {
        planCode: row.planCode,
        warehouse: row.warehouse,
        site: row.site,
        location: row.location,
        itemCode: row.itemCode,
        itemDescription: row.itemDescription,
        uom: row.uom,
        firstCountQty: row.firstQty,
        secondCountQty: row.secondQty,
        varianceQty: row.betweenCountsQty,
        variancePercent: row.betweenCountsPercent,
        severity: row.severity,
      };
    }

    if (type === "system-vs-first") {
      return {
        planCode: row.planCode,
        warehouse: row.warehouse,
        site: row.site,
        location: row.location,
        itemCode: row.itemCode,
        itemDescription: row.itemDescription,
        systemStockQty: row.systemQty,
        firstCountQty: row.firstQty,
        varianceQty: row.firstVarianceQty,
        variancePercent: row.firstVariancePercent,
        severity: row.severity,
      };
    }

    if (type === "system-vs-second") {
      return {
        planCode: row.planCode,
        warehouse: row.warehouse,
        site: row.site,
        location: row.location,
        itemCode: row.itemCode,
        itemDescription: row.itemDescription,
        systemStockQty: row.systemQty,
        secondCountQty: row.secondQty,
        varianceQty: row.secondVarianceQty,
        variancePercent: row.secondVariancePercent,
        severity: row.severity,
      };
    }

    return {
      planCode: row.planCode,
      warehouse: row.warehouse,
      site: row.site,
      location: row.location,
      itemCode: row.itemCode,
      itemDescription: row.itemDescription,
      uom: row.uom,
      systemStockQty: row.systemQty,
      firstCountQty: row.firstQty,
      secondCountQty: row.secondQty,
      firstVariance: row.firstVarianceQty,
      secondVariance: row.secondVarianceQty,
      finalVariance: row.finalVarianceQty,
      variancePercent: row.finalVariancePercent,
      severity: row.severity,
      status: row.status,
      remarks: "",
    };
  }

  private getDefaultHeaders(type: ReportType) {
    return Object.keys(this.projectRow(type, {
      planId: "",
      planCode: "",
      warehouse: "",
      site: "",
      location: "",
      itemCode: "",
      itemDescription: "",
      uom: "",
      systemQty: 0,
      firstQty: 0,
      secondQty: 0,
      firstVarianceQty: 0,
      firstVariancePercent: 0,
      secondVarianceQty: 0,
      secondVariancePercent: 0,
      betweenCountsQty: 0,
      betweenCountsPercent: 0,
      finalVarianceQty: 0,
      finalVariancePercent: 0,
      severity: "matched",
      status: "",
    }));
  }

  private toHeaderLabel(header: string) {
    return header
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (value) => value.toUpperCase())
      .trim();
  }

  private getSheetName(type: ReportType) {
    if (type === "first-vs-second") return "First vs Second";
    if (type === "system-vs-first") return "System vs First";
    if (type === "system-vs-second") return "System vs Second";
    return "Final Variance";
  }

  private percent(variance: number, baseline: number) {
    if (baseline === 0) return variance === 0 ? 0 : 100;
    return Number(((variance / baseline) * 100).toFixed(2));
  }
}
