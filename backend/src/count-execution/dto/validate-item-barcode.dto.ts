import { IsIn, IsOptional, IsString } from "class-validator";

export class ValidateItemBarcodeDto {
  @IsIn(["FIRST", "SECOND"])
  countType!: "FIRST" | "SECOND";

  @IsString()
  barcode!: string;

  @IsOptional()
  @IsString()
  locationId?: string;
}
