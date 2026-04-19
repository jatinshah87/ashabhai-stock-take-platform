import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class ImportBatchMetaDto {
  @IsOptional()
  @IsString()
  sourceSystem?: string;

  @IsOptional()
  @IsString()
  sourceLabel?: string;
}

export class QueryImportJobsDto {
  @IsOptional()
  @IsIn(["WAREHOUSE", "SITE", "LOCATION", "ITEM", "ITEM_BARCODE", "ITEM_UOM", "STOCK_SNAPSHOT"])
  importType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export function batchDtoFactory<TRecord extends abstract new (...args: never[]) => object>(
  RecordClass: TRecord,
) {
  class ImportBatchDto extends ImportBatchMetaDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecordClass)
    records!: InstanceType<TRecord>[];
  }

  return ImportBatchDto;
}
