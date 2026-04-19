import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditLogService } from "src/audit-log/audit-log.service";
import { CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { InterpretQuantityDto } from "./dto/interpret-quantity.dto";
import { VoiceCountingEventDto } from "./dto/voice-counting-event.dto";

const WORD_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  point: -1,
};

@Injectable()
export class VoiceService {
  constructor(private readonly auditLogService: AuditLogService) {}

  getConfig() {
    return {
      enabled: true,
      locale: "en-IN",
      supportsBrowserSpeechApi: true,
      confirmationRequired: true,
      manualOverrideAlwaysAvailable: true,
      hints: [
        "Say numeric quantities clearly, for example 'twelve' or 'one hundred twenty four'.",
        "Always confirm the interpreted quantity before saving the count line.",
      ],
    };
  }

  async interpretQuantity(dto: InterpretQuantityDto, actor?: CurrentUserPayload) {
    const transcript = dto.transcript.trim();
    if (!transcript) {
      throw new BadRequestException("Transcript is required");
    }

    const interpreted = this.parseQuantity(transcript);
    if (interpreted.quantity === null || Number.isNaN(interpreted.quantity)) {
      throw new BadRequestException("Unable to interpret a valid quantity from the voice transcript");
    }

    if (interpreted.quantity < 0) {
      throw new BadRequestException("Voice quantity must be zero or greater");
    }

    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: "VOICE_QUANTITY_INTERPRETED",
      entityType: "VOICE",
      metadata: {
        transcript,
        normalizedTranscript: interpreted.normalizedTranscript,
        quantity: interpreted.quantity,
        confidence: interpreted.confidence,
        uomCode: dto.uomCode ?? null,
      },
    });

    return {
      transcript,
      normalizedTranscript: interpreted.normalizedTranscript,
      interpretedQuantity: interpreted.quantity,
      confidence: interpreted.confidence,
      requiresConfirmation: true,
      uomCode: dto.uomCode ?? null,
      confirmationText: `Confirm quantity ${interpreted.quantity}${dto.uomCode ? ` ${dto.uomCode}` : ""}`,
    };
  }

  async logCountingEvent(dto: VoiceCountingEventDto, actor?: CurrentUserPayload) {
    await this.auditLogService.log({
      actorUserId: actor?.sub,
      action: dto.eventType,
      entityType: "VOICE",
      entityId: dto.planId,
      metadata: {
        planId: dto.planId ?? null,
        countType: dto.countType ?? null,
        transcript: dto.transcript ?? null,
        metadata: dto.metadata ?? {},
      },
    });

    return { success: true };
  }

  private parseQuantity(transcript: string) {
    const numericMatch = transcript.match(/-?\d+(\.\d+)?/);
    if (numericMatch) {
      return {
        quantity: Number(numericMatch[0]),
        normalizedTranscript: numericMatch[0],
        confidence: 0.96,
      };
    }

    const tokens = transcript
      .toLowerCase()
      .replace(/[^a-z\s.-]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    let total = 0;
    let current = 0;
    let decimalMode = false;
    let decimalValue = "";

    for (const token of tokens) {
      const value = WORD_NUMBERS[token];
      if (value === undefined) {
        continue;
      }

      if (value === -1) {
        decimalMode = true;
        continue;
      }

      if (decimalMode) {
        decimalValue += String(value);
        continue;
      }

      if (value === 100 || value === 1000) {
        current = current === 0 ? value : current * value;
        if (value === 1000) {
          total += current;
          current = 0;
        }
      } else {
        current += value;
      }
    }

    const quantity =
      total + current + (decimalValue ? Number(`0.${decimalValue}`) : 0);

    return {
      quantity: quantity || quantity === 0 ? quantity : null,
      normalizedTranscript: transcript.toLowerCase(),
      confidence: decimalValue ? 0.8 : 0.88,
    };
  }
}
