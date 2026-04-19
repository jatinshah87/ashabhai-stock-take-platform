import { Module } from "@nestjs/common";
import { AuditLogModule } from "src/audit-log/audit-log.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { IntegrationController } from "./integration.controller";
import { IntegrationService } from "./integration.service";

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [IntegrationController],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
