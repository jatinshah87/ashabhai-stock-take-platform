import { IsIn } from "class-validator";

export class ListCountEntriesDto {
  @IsIn(["FIRST", "SECOND"])
  countType!: "FIRST" | "SECOND";
}
