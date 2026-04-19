import { IsOptional, IsString } from "class-validator";

export class InterpretQuantityDto {
  @IsString()
  transcript!: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  uomCode?: string;
}
