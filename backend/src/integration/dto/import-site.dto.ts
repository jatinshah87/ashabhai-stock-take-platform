import { IsIn, IsOptional, IsString } from "class-validator";
import { batchDtoFactory } from "./import-common.dto";

export class ImportSiteRecordDto {
  @IsString()
  warehouseCode!: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  type!: string;

  @IsString()
  manager!: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";
}

export class ImportSitesDto extends batchDtoFactory(ImportSiteRecordDto) {}
