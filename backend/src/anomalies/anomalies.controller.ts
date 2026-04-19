import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUser, CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { QueryAnomaliesDto } from "./dto/query-anomalies.dto";
import { ReviewAnomalyDto } from "./dto/review-anomaly.dto";
import { RunAnomaliesDto } from "./dto/run-anomalies.dto";
import { AnomaliesService } from "./anomalies.service";

@Controller("anomalies")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
@Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.MANAGEMENT)
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get()
  list(@Query() query: QueryAnomaliesDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.anomaliesService.list(query, user);
  }

  @Get("summary")
  summary(@Query() query: QueryAnomaliesDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.anomaliesService.summary(query, user);
  }

  @Post("run")
  run(@Body() dto: RunAnomaliesDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.anomaliesService.run(dto, user);
  }

  @Get(":id")
  detail(@Param("id") id: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.anomaliesService.detail(id, user);
  }

  @Post(":id/review")
  review(
    @Param("id") id: string,
    @Body() dto: ReviewAnomalyDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.anomaliesService.review(id, dto, user);
  }
}
