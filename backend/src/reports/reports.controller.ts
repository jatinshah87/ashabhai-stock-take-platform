import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUser, CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { QueryReportDto } from "./dto/query-report.dto";
import { ReportsService, ReportType } from "./reports.service";

@Controller("reports")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
@Roles(
  ROLE_CODES.SYSTEM_ADMIN,
  ROLE_CODES.AUDITOR,
  ROLE_CODES.WAREHOUSE_USER,
  ROLE_CODES.MANAGEMENT,
)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("first-vs-second")
  getFirstVsSecond(@Query() query: QueryReportDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.reportsService.getReport("first-vs-second", query, user);
  }

  @Get("system-vs-first")
  getSystemVsFirst(@Query() query: QueryReportDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.reportsService.getReport("system-vs-first", query, user);
  }

  @Get("system-vs-second")
  getSystemVsSecond(@Query() query: QueryReportDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.reportsService.getReport("system-vs-second", query, user);
  }

  @Get("final-variance")
  getFinalVariance(@Query() query: QueryReportDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.reportsService.getReport("final-variance", query, user);
  }

  @Get("first-vs-second/export")
  exportFirstVsSecond(
    @Query() query: QueryReportDto,
    @CurrentUser() user: CurrentUserPayload | undefined,
    @Res() res: Response,
  ) {
    return this.exportReport("first-vs-second", query, user, res);
  }

  @Get("system-vs-first/export")
  exportSystemVsFirst(
    @Query() query: QueryReportDto,
    @CurrentUser() user: CurrentUserPayload | undefined,
    @Res() res: Response,
  ) {
    return this.exportReport("system-vs-first", query, user, res);
  }

  @Get("system-vs-second/export")
  exportSystemVsSecond(
    @Query() query: QueryReportDto,
    @CurrentUser() user: CurrentUserPayload | undefined,
    @Res() res: Response,
  ) {
    return this.exportReport("system-vs-second", query, user, res);
  }

  @Get("final-variance/export")
  exportFinalVariance(
    @Query() query: QueryReportDto,
    @CurrentUser() user: CurrentUserPayload | undefined,
    @Res() res: Response,
  ) {
    return this.exportReport("final-variance", query, user, res);
  }

  private async exportReport(
    type: ReportType,
    query: QueryReportDto,
    user: CurrentUserPayload | undefined,
    res: Response,
  ) {
    const exported = await this.reportsService.exportReport(type, query, user);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${exported.filename}"`);
    res.send(exported.buffer);
  }
}
