import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  employeeCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(["Admin", "Auditor", "Warehouse"])
  role?: "Admin" | "Auditor" | "Warehouse";

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  siteIds?: string[];

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";
}
