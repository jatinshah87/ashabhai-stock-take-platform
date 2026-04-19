import { Module } from "@nestjs/common";
import { AuditLogModule } from "src/audit-log/audit-log.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
