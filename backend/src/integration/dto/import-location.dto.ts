import { IsIn, IsOptional, IsString } from "class-validator";
import { batchDtoFactory } from "./import-common.dto";

export class ImportLocationRecordDto {
  @IsString()
  warehouseCode!: string;

  @IsString()
  siteCode!: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  aisle!: string;

  @IsString()
  zone!: string;

  @IsString()
  barcode!: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";
}

export class ImportLocationsDto extends batchDtoFactory(ImportLocationRecordDto) {}
