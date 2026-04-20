import { Module } from "@nestjs/common";
import { AuditLogModule } from "src/audit-log/audit-log.module";
import { AuthModule } from "src/auth/auth.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { AnomaliesController } from "./anomalies.controller";
import { AnomaliesService } from "./anomalies.service";

@Module({
  imports: [PrismaModule, AuditLogModule, AuthModule],
  controllers: [AnomaliesController],
  providers: [AnomaliesService],
  exports: [AnomaliesService],
})
export class AnomaliesModule {}
