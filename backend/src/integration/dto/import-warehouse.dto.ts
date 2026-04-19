import { IsIn, IsOptional, IsString } from "class-validator";
import { batchDtoFactory } from "./import-common.dto";

export class ImportWarehouseRecordDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  city!: string;

  @IsString()
  region!: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";
}

export class ImportWarehousesDto extends batchDtoFactory(ImportWarehouseRecordDto) {}
