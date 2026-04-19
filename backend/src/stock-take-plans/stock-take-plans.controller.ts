import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUser, CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { CreateStockTakePlanDto } from "./dto/create-stock-take-plan.dto";
import { QueryStockTakePlansDto } from "./dto/query-stock-take-plans.dto";
import { UpdateStockTakePlanDto } from "./dto/update-stock-take-plan.dto";
import { StockTakePlansService } from "./stock-take-plans.service";

@Controller("stock-take-plans")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
export class StockTakePlansController {
  constructor(private readonly stockTakePlansService: StockTakePlansService) {}

  @Get()
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  list(@Query() query: QueryStockTakePlansDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.stockTakePlansService.list(query, user);
  }

  @Get("calendar")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  calendar(@CurrentUser() user?: CurrentUserPayload) {
    return this.stockTakePlansService.calendar(user);
  }

  @Get(":id")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  findOne(@Param("id") id: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.stockTakePlansService.findOne(id, user);
  }

  @Post()
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR)
  create(
    @Body() dto: CreateStockTakePlanDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.stockTakePlansService.create(dto, user);
  }

  @Patch(":id")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateStockTakePlanDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.stockTakePlansService.update(id, dto, user);
  }
}
