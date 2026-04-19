import { IsIn, IsOptional, IsString } from "class-validator";

export class ResolveSyncConflictDto {
  @IsIn(["KEEP_LOCAL", "KEEP_SERVER", "MARK_REVIEW", "RETRY_REPLAY"])
  resolutionAction!: "KEEP_LOCAL" | "KEEP_SERVER" | "MARK_REVIEW" | "RETRY_REPLAY";

  @IsOptional()
  @IsString()
  notes?: string;
}
