import { Module } from "@nestjs/common";
import { AuditLogModule } from "src/audit-log/audit-log.module";
import { AdminImportRateLimitGuard } from "src/common/guards/rate-limit.guard";
import { PrismaModule } from "src/prisma/prisma.module";
import { IntegrationController } from "./integration.controller";
import { IntegrationService } from "./integration.service";

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [IntegrationController],
  providers: [IntegrationService, AdminImportRateLimitGuard],
  exports: [IntegrationService],
})
export class IntegrationModule {}
