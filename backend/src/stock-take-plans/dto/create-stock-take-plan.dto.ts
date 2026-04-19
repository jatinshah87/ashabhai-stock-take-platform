import { IsArray, IsBoolean, IsDateString, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class CreateStockTakePlanDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  description!: string;

  @IsString()
  warehouseId!: string;

  @IsArray()
  @IsString({ each: true })
  siteIds!: string[];

  @IsArray()
  @IsString({ each: true })
  locationIds!: string[];

  @IsDateString()
  scheduledDate!: string;

  @IsString()
  scheduleWindow!: string;

  @IsString()
  firstCountUserId!: string;

  @IsString()
  secondCountUserId!: string;

  @IsString()
  notes!: string;

  @IsString()
  instructions!: string;

  @IsIn(["Blind Count", "Frozen Count", "Cycle Count"])
  countMethod!: "Blind Count" | "Frozen Count" | "Cycle Count";

  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @IsOptional()
  @IsBoolean()
  highVariancePlaceholder?: boolean;

  @IsIn(["Draft", "Scheduled", "In Progress", "Completed"])
  status!: "Draft" | "Scheduled" | "In Progress" | "Completed";
}
