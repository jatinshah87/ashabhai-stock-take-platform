import { IsIn, IsOptional, IsString } from "class-validator";

const severityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const statusValues = ["OPEN", "REVIEWED", "CLOSED"] as const;
const typeValues = [
  "HIGH_VARIANCE",
  "EXTREME_MISMATCH",
  "FIRST_SECOND_MISMATCH",
  "UOM_CONSISTENCY",
  "REPEATED_USER_VARIANCE",
  "RAPID_COUNTING",
  "REPEATED_SYNC_CONFLICT",
  "DATA_FRESHNESS",
] as const;

export class QueryAnomaliesDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsIn(severityValues)
  severity?: (typeof severityValues)[number];

  @IsOptional()
  @IsIn(statusValues)
  status?: (typeof statusValues)[number];

  @IsOptional()
  @IsIn(typeValues)
  anomalyType?: (typeof typeValues)[number];

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
