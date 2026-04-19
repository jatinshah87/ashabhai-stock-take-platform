import { IsIn, IsString } from "class-validator";

export class ValidateLocationBarcodeDto {
  @IsIn(["FIRST", "SECOND"])
  countType!: "FIRST" | "SECOND";

  @IsString()
  barcode!: string;
}
