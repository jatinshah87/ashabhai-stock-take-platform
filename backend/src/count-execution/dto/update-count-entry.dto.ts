import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateCountEntryDto {
  @IsIn(["FIRST", "SECOND"])
  countType!: "FIRST" | "SECOND";

  @IsOptional()
  @IsString()
  itemUomId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  countedQty?: number;
}
