import { IsIn, IsOptional, IsString } from "class-validator";

export class QueryStockTakePlansDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsIn(["Draft", "Scheduled", "In Progress", "Completed"])
  status?: "Draft" | "Scheduled" | "In Progress" | "Completed";
}
