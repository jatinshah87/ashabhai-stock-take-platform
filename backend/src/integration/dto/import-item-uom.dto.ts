import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { batchDtoFactory } from "./import-common.dto";

export class ImportItemUomRecordDto {
  @IsString()
  itemCode!: string;

  @IsString()
  uomCode!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  conversionFactor!: number;

  @IsOptional()
  @IsBoolean()
  isBase?: boolean;
}

export class ImportItemUomsDto extends batchDtoFactory(ImportItemUomRecordDto) {}
