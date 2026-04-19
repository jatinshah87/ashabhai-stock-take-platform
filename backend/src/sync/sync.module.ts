import { Module } from "@nestjs/common";
import { AuditLogModule } from "src/audit-log/audit-log.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { SyncController } from "./sync.controller";
import { SyncService } from "./sync.service";

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
