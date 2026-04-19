import { Type } from "class-transformer";
import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { batchDtoFactory } from "./import-common.dto";

export class ImportStockSnapshotRecordDto {
  @IsString()
  warehouseCode!: string;

  @IsString()
  siteCode!: string;

  @IsString()
  locationCode!: string;

  @IsString()
  itemCode!: string;

  @IsString()
  uomCode!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsDateString()
  snapshotAt!: string;

  @IsOptional()
  @IsString()
  sourceReference?: string;
}

export class ImportStockSnapshotsDto extends batchDtoFactory(ImportStockSnapshotRecordDto) {}
