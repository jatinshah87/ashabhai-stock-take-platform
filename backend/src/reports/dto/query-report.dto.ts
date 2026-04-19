import { IsIn, IsOptional, IsString } from "class-validator";

export class QueryReportDto {
  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsIn(["low", "medium", "high", "matched"])
  severity?: "low" | "medium" | "high" | "matched";
}
