import { IsBoolean, IsOptional, IsString } from "class-validator";
import { batchDtoFactory } from "./import-common.dto";

export class ImportItemBarcodeRecordDto {
  @IsString()
  itemCode!: string;

  @IsString()
  barcode!: string;

  @IsOptional()
  @IsString()
  uomCode?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class ImportItemBarcodesDto extends batchDtoFactory(ImportItemBarcodeRecordDto) {}
