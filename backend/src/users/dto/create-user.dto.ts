import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  employeeCode!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsIn(["Admin", "Auditor", "Warehouse"])
  role!: "Admin" | "Auditor" | "Warehouse";

  @IsString()
  warehouseId!: string;

  @IsArray()
  @IsString({ each: true })
  siteIds!: string[];

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";
}
