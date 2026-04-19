import { IsIn, IsOptional, IsString } from "class-validator";

const reviewStatuses = ["OPEN", "REVIEWED", "CLOSED"] as const;

export class ReviewAnomalyDto {
  @IsIn(reviewStatuses)
  status!: (typeof reviewStatuses)[number];

  @IsOptional()
  @IsString()
  notes?: string;
}
