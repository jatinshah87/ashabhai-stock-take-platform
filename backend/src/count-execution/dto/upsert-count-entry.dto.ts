import { Type } from "class-transformer";
import { IsIn, IsNumber, IsString, Min } from "class-validator";

export class UpsertCountEntryDto {
  @IsIn(["FIRST", "SECOND"])
  countType!: "FIRST" | "SECOND";

  @IsString()
  locationId!: string;

  @IsString()
  itemId!: string;

  @IsString()
  itemUomId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  countedQty!: number;
}
