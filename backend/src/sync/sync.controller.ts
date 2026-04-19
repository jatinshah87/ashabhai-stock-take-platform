import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUser, CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { QuerySyncConflictsDto } from "./dto/query-sync-conflicts.dto";
import { QuerySyncQueueDto } from "./dto/query-sync-queue.dto";
import { ResolveSyncConflictDto } from "./dto/resolve-sync-conflict.dto";
import { SyncBatchDto } from "./dto/sync-batch.dto";
import { SyncService } from "./sync.service";

@Controller("sync")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post("batch")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  submitBatch(@Body() dto: SyncBatchDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.syncService.submitBatch(dto, user);
  }

  @Get("queue")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  getQueue(@Query() query: QuerySyncQueueDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.syncService.getQueue(query, user);
  }

  @Get("queue/:id")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  getQueueById(@Param("id") id: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.syncService.getQueueById(id, user);
  }

  @Get("conflicts")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR)
  getConflicts(@Query() query: QuerySyncConflictsDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.syncService.getConflicts(query, user);
  }

  @Get("conflicts/:id")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR)
  getConflictById(@Param("id") id: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.syncService.getConflictById(id, user);
  }

  @Post("conflicts/:id/resolve")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR)
  resolveConflict(
    @Param("id") id: string,
    @Body() dto: ResolveSyncConflictDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.syncService.resolveConflict(id, dto, user);
  }

  @Get("summary")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  getSummary(@CurrentUser() user?: CurrentUserPayload) {
    return this.syncService.getSummary(user);
  }
}
