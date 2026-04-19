import { IsIn, IsOptional, IsString } from "class-validator";

export class QuerySyncConflictsDto {
  @IsOptional()
  @IsIn(["OPEN", "RESOLVED", "REVIEW_REQUIRED", "REJECTED"])
  status?: "OPEN" | "RESOLVED" | "REVIEW_REQUIRED" | "REJECTED";

  @IsOptional()
  @IsIn([
    "DUPLICATE_LINE",
    "PLAN_LOCKED",
    "SERVER_STATE_MISMATCH",
    "SUBMISSION_CONFLICT",
    "OUT_OF_SCOPE",
    "INVALID_REFERENCE",
  ])
  conflictType?:
    | "DUPLICATE_LINE"
    | "PLAN_LOCKED"
    | "SERVER_STATE_MISMATCH"
    | "SUBMISSION_CONFLICT"
    | "OUT_OF_SCOPE"
    | "INVALID_REFERENCE";

  @IsOptional()
  @IsString()
  planId?: string;
}
