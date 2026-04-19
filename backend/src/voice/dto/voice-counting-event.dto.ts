import { IsIn, IsObject, IsOptional, IsString } from "class-validator";

const eventTypes = [
  "VOICE_START",
  "VOICE_RECOGNIZED",
  "VOICE_CONFIRMED",
  "VOICE_REJECTED",
  "VOICE_FAILED",
] as const;

export class VoiceCountingEventDto {
  @IsIn(eventTypes)
  eventType!: (typeof eventTypes)[number];

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  countType?: string;

  @IsOptional()
  @IsString()
  transcript?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
