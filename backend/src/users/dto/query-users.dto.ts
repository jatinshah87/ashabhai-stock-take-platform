import { IsIn, IsOptional, IsString } from "class-validator";

export class QueryUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["Admin", "Auditor", "Warehouse"])
  role?: "Admin" | "Auditor" | "Warehouse";

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";
}
