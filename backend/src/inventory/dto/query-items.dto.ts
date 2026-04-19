import { IsIn, IsOptional, IsString } from "class-validator";

export class QueryItemsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";
}
