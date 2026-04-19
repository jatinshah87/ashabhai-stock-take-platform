import {
  Body,
  Controller,
  Delete,
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
import { CountExecutionService } from "./count-execution.service";
import { ListCountEntriesDto } from "./dto/list-count-entries.dto";
import { SubmitCountDto } from "./dto/submit-count.dto";
import { UpdateCountEntryDto } from "./dto/update-count-entry.dto";
import { UpsertCountEntryDto } from "./dto/upsert-count-entry.dto";
import { ValidateItemBarcodeDto } from "./dto/validate-item-barcode.dto";
import { ValidateLocationBarcodeDto } from "./dto/validate-location-barcode.dto";

@Controller("count-execution")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
@Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
export class CountExecutionController {
  constructor(private readonly countExecutionService: CountExecutionService) {}

  @Get("my-plans")
  listMyPlans(@CurrentUser() user?: CurrentUserPayload) {
    return this.countExecutionService.listMyAssignedPlans(user);
  }

  @Get("plans/:planId")
  getPlanExecution(
    @Param("planId") planId: string,
    @Query("countType") countType: "FIRST" | "SECOND" | undefined,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.countExecutionService.getPlanExecution(planId, countType, user);
  }

  @Post("plans/:planId/validate-location")
  validateLocation(
    @Param("planId") planId: string,
    @Body() dto: ValidateLocationBarcodeDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.countExecutionService.validateLocation(planId, dto, user);
  }

  @Post("plans/:planId/validate-item")
  validateItem(
    @Param("planId") planId: string,
    @Body() dto: ValidateItemBarcodeDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.countExecutionService.validateItem(planId, dto, user);
  }

  @Get("plans/:planId/entries")
  listEntries(
    @Param("planId") planId: string,
    @Query() query: ListCountEntriesDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.countExecutionService.listEntries(planId, query, user);
  }

  @Get("plans/:planId/review")
  getReview(
    @Param("planId") planId: string,
    @Query() query: ListCountEntriesDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.countExecutionService.getReview(planId, query, user);
  }

  @Post("plans/:planId/entries")
  saveEntry(
    @Param("planId") planId: string,
    @Body() dto: UpsertCountEntryDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.countExecutionService.saveEntry(planId, dto, user);
  }

  @Patch("plans/:planId/entries/:entryId")
  updateEntry(
    @Param("planId") planId: string,
    @Param("entryId") entryId: string,
    @Body() dto: UpdateCountEntryDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.countExecutionService.updateEntry(planId, entryId, dto, user);
  }

  @Delete("plans/:planId/entries/:entryId")
  deleteEntry(
    @Param("planId") planId: string,
    @Param("entryId") entryId: string,
    @Query() query: ListCountEntriesDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.countExecutionService.deleteEntry(planId, entryId, query, user);
  }

  @Post("plans/:planId/submit")
  submit(
    @Param("planId") planId: string,
    @Body() dto: SubmitCountDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.countExecutionService.submit(planId, dto, user);
  }
}
