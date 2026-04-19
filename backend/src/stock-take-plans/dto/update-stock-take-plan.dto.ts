import { IsArray, IsBoolean, IsDateString, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateStockTakePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  siteIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locationIds?: string[];

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  scheduleWindow?: string;

  @IsOptional()
  @IsString()
  firstCountUserId?: string;

  @IsOptional()
  @IsString()
  secondCountUserId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsIn(["Blind Count", "Frozen Count", "Cycle Count"])
  countMethod?: "Blind Count" | "Frozen Count" | "Cycle Count";

  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @IsOptional()
  @IsBoolean()
  highVariancePlaceholder?: boolean;

  @IsOptional()
  @IsIn(["Draft", "Scheduled", "In Progress", "Completed"])
  status?: "Draft" | "Scheduled" | "In Progress" | "Completed";
}
