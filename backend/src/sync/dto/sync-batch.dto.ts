import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class SyncBatchRecordDto {
  @IsString()
  planId!: string;

  @IsIn(["FIRST", "SECOND"])
  countType!: "FIRST" | "SECOND";

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsString()
  itemUomId?: string;

  @IsOptional()
  @IsString()
  uomCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  countedQuantity?: number;

  @IsIn(["CREATE", "UPDATE", "DELETE", "SUBMIT"])
  actionType!: "CREATE" | "UPDATE" | "DELETE" | "SUBMIT";

  @IsString()
  clientEntryId!: string;

  @IsDateString()
  clientTimestamp!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  payloadSnapshot?: Record<string, unknown>;
}

export class SyncBatchDto {
  @IsString()
  deviceId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncBatchRecordDto)
  records!: SyncBatchRecordDto[];
}
