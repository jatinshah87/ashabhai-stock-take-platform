import { IsIn, IsOptional, IsString } from "class-validator";

const severityValues = ["matched", "low", "medium", "high"] as const;
const statusValues = ["Draft", "Scheduled", "In Progress", "Completed"] as const;

export class QueryAnalyticsDto {
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
  userId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsIn(severityValues)
  severity?: (typeof severityValues)[number];

  @IsOptional()
  @IsIn(statusValues)
  status?: (typeof statusValues)[number];

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
