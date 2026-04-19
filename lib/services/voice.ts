import { apiFetch } from "@/lib/api/http";
import { VoiceConfig, VoiceInterpretResponse } from "@/lib/types";

export function getVoiceConfig() {
  return apiFetch<VoiceConfig>("/voice/config");
}

export function interpretQuantityTranscript(payload: {
  transcript: string;
  locale?: string;
  uomCode?: string;
}) {
  return apiFetch<VoiceInterpretResponse>("/voice/interpret-quantity", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logVoiceCountingEvent(payload: {
  eventType:
    | "VOICE_START"
    | "VOICE_RECOGNIZED"
    | "VOICE_CONFIRMED"
    | "VOICE_REJECTED"
    | "VOICE_FAILED";
  planId?: string;
  countType?: string;
  transcript?: string;
  metadata?: Record<string, unknown>;
}) {
  return apiFetch<{ success: true }>("/voice/counting-event", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
