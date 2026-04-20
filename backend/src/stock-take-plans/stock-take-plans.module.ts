import { Module } from "@nestjs/common";
import { AuditLogModule } from "src/audit-log/audit-log.module";
import { StockTakePlansController } from "./stock-take-plans.controller";
import { StockTakePlansService } from "./stock-take-plans.service";

@Module({
  imports: [AuditLogModule],
  controllers: [StockTakePlansController],
  providers: [StockTakePlansService],
  exports: [StockTakePlansService],
})
export class StockTakePlansModule {}
