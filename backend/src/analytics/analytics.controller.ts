import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUser, CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { QueryAnalyticsDto } from "./dto/query-analytics.dto";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
@Roles(
  ROLE_CODES.SYSTEM_ADMIN,
  ROLE_CODES.AUDITOR,
  ROLE_CODES.WAREHOUSE_USER,
  ROLE_CODES.MANAGEMENT,
)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("operational-summary")
  getOperationalSummary(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.analyticsService.getOperationalSummary(query, user);
  }

  @Get("management-summary")
  getManagementSummary(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.analyticsService.getManagementSummary(query, user);
  }

  @Get("warehouse-progress")
  getWarehouseProgress(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.analyticsService.getWarehouseProgress(query, user);
  }

  @Get("site-progress")
  getSiteProgress(@Query() query: QueryAnalyticsDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.analyticsService.getSiteProgress(query, user);
  }

  @Get("variance-hotspots")
  getVarianceHotspots(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.analyticsService.getVarianceHotspots(query, user);
  }

  @Get("productivity")
  getProductivity(@Query() query: QueryAnalyticsDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.analyticsService.getProductivity(query, user);
  }

  @Get("sync-health")
  getSyncHealth(@Query() query: QueryAnalyticsDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.analyticsService.getSyncHealth(query, user);
  }

  @Get("integration-health")
  getIntegrationHealth(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.analyticsService.getIntegrationHealth(query, user);
  }

  @Get("completion-trends")
  getCompletionTrends(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.analyticsService.getCompletionTrends(query, user);
  }
}
