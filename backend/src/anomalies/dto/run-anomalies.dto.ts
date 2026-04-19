import { IsOptional, IsString } from "class-validator";

export class RunAnomaliesDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  planId?: string;
}
