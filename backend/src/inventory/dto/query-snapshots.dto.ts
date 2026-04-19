import { IsOptional, IsString } from "class-validator";

export class QuerySnapshotsDto {
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
}
