import { Module } from "@nestjs/common";
import { StockTakePlansController } from "./stock-take-plans.controller";
import { StockTakePlansService } from "./stock-take-plans.service";

@Module({
  controllers: [StockTakePlansController],
  providers: [StockTakePlansService],
  exports: [StockTakePlansService],
})
export class StockTakePlansModule {}
