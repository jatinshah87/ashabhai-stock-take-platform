import { IsIn, IsOptional, IsString } from "class-validator";
import { batchDtoFactory } from "./import-common.dto";

export class ImportItemRecordDto {
  @IsString()
  code!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";
}

export class ImportItemsDto extends batchDtoFactory(ImportItemRecordDto) {}
