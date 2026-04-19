import { IsIn, IsOptional, IsString } from "class-validator";

export class SubmitCountDto {
  @IsIn(["FIRST", "SECOND"])
  countType!: "FIRST" | "SECOND";

  @IsOptional()
  @IsString()
  notes?: string;
}
