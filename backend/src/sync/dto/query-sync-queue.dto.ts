import { IsIn, IsOptional, IsString } from "class-validator";

export class QuerySyncQueueDto {
  @IsOptional()
  @IsIn(["PENDING", "PROCESSED", "FAILED", "CONFLICT", "RESOLVED", "SKIPPED"])
  syncStatus?: "PENDING" | "PROCESSED" | "FAILED" | "CONFLICT" | "RESOLVED" | "SKIPPED";

  @IsOptional()
  @IsString()
  planId?: string;
}
