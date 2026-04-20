import { Module } from "@nestjs/common";
import { AuditLogModule } from "src/audit-log/audit-log.module";
import { AuthModule } from "src/auth/auth.module";
import { InventoryModule } from "src/inventory/inventory.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { CountExecutionController } from "./count-execution.controller";
import { CountExecutionService } from "./count-execution.service";

@Module({
  imports: [PrismaModule, AuditLogModule, InventoryModule, AuthModule],
  controllers: [CountExecutionController],
  providers: [CountExecutionService],
})
export class CountExecutionModule {}
