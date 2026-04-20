import { Module } from "@nestjs/common";
import { AuditLogModule } from "src/audit-log/audit-log.module";
import { AuthModule } from "src/auth/auth.module";
import { StockTakePlansController } from "./stock-take-plans.controller";
import { StockTakePlansService } from "./stock-take-plans.service";

@Module({
  imports: [AuditLogModule, AuthModule],
  controllers: [StockTakePlansController],
  providers: [StockTakePlansService],
  exports: [StockTakePlansService],
})
export class StockTakePlansModule {}
