"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Mic, MicOff, Trash2, Waves } from "lucide-react";
import { CountingContextBar } from "@/components/counting/counting-context-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteCountEntry,
  getExecutionPlan,
  listCountEntries,
  saveCountEntry,
  validateItemBarcode,
} from "@/lib/services/counting";
import {
  CountEntryRecord,
  CountTypeCode,
  ExecutionPlanDetail,
  ValidatedItem,
  VoiceConfig,
  VoiceInterpretResponse,
} from "@/lib/types";
import { getVoiceConfig, interpretQuantityTranscript, logVoiceCountingEvent } from "@/lib/services/voice";

export function ItemCountClient({ planId }: { planId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const countType = (searchParams.get("countType") as CountTypeCode | null) ?? "FIRST";
  const locationId = searchParams.get("locationId") ?? "";
  const [plan, setPlan] = useState<ExecutionPlanDetail | null>(null);
  const [entries, setEntries] = useState<CountEntryRecord[]>([]);
  const [barcode, setBarcode] = useState("");
  const [validatedItem, setValidatedItem] = useState<ValidatedItem | null>(null);
  const [selectedUomId, setSelectedUomId] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null);
  const [voiceState, setVoiceState] = useState<
    "idle" | "listening" | "processing" | "recognized" | "confirmation" | "failed"
  >("idle");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceInterpretation, setVoiceInterpretation] = useState<VoiceInterpretResponse | null>(null);

  async function refreshEntries() {
    const data = await listCountEntries(planId, countType);
    setEntries(data);
  }

  useEffect(() => {
    let active = true;
    Promise.all([getExecutionPlan(planId, countType), listCountEntries(planId, countType)])
      .then(([planData, entryData]) => {
        if (active) {
          setPlan(planData);
          setEntries(entryData);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load counting workspace.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [planId, countType]);

  useEffect(() => {
    getVoiceConfig()
      .then(setVoiceConfig)
      .catch(() => {
        setVoiceConfig({
          enabled: true,
          locale: "en-IN",
          supportsBrowserSpeechApi: true,
          confirmationRequired: true,
          manualOverrideAlwaysAvailable: true,
          hints: [],
        });
      });
  }, []);

  const currentLocation = useMemo(
    () => plan?.locations.find((location) => location.id === locationId) ?? null,
    [plan, locationId],
  );

  async function handleItemValidation() {
    if (!barcode.trim() || !locationId) return;
    setIsValidating(true);
    setError(null);
    setSaveMessage(null);

    try {
      const item = await validateItemBarcode(planId, {
        countType,
        barcode: barcode.trim(),
        locationId,
      });
      setValidatedItem(item);
      setSelectedUomId(
        item.uoms.find((uom) => uom.uomCode === item.scannedUomCode)?.id ?? item.uoms[0]?.id ?? "",
      );
      setQuantity("0");
    } catch (validateError) {
      setError(validateError instanceof Error ? validateError.message : "Item validation failed.");
      setValidatedItem(null);
      setSelectedUomId("");
    } finally {
      setIsValidating(false);
    }
  }

  async function handleSave() {
    if (!validatedItem || !selectedUomId || !locationId || !currentLocation || !plan) return;
    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const saved = await saveCountEntry(planId, {
        countType,
        locationId,
        itemId: validatedItem.id,
        itemUomId: selectedUomId,
        countedQty: Number(quantity),
        locationCode: currentLocation.code,
        locationName: currentLocation.name,
        itemCode: validatedItem.code,
        itemDescription: validatedItem.description,
        uomCode: validatedItem.uoms.find((uom) => uom.id === selectedUomId)?.uomCode,
        scannedItem: validatedItem,
        validatedLocation: {
          id: currentLocation.id,
          siteId: currentLocation.siteId,
          warehouseId: plan.warehouse.id,
          code: currentLocation.code,
          name: currentLocation.name,
          barcode: currentLocation.barcode,
          aisle: "",
          zone: "",
        },
      });
      await refreshEntries();
      setSaveMessage(saved.syncStatus === "local-pending" ? "Count line queued for sync." : "Count line saved.");
      setBarcode("");
      setValidatedItem(null);
      setSelectedUomId("");
      setQuantity("0");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the count line.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleVoiceTranscriptInterpretation(transcript: string) {
    const selectedUomCode =
      validatedItem?.uoms.find((uom) => uom.id === selectedUomId)?.uomCode ?? undefined;
    setVoiceTranscript(transcript);
    setVoiceState("processing");
    try {
      const interpreted = await interpretQuantityTranscript({
        transcript,
        locale: voiceConfig?.locale,
        uomCode: selectedUomCode,
      });
      setVoiceInterpretation(interpreted);
      setVoiceState("confirmation");
      await logVoiceCountingEvent({
        eventType: "VOICE_RECOGNIZED",
        planId,
        countType,
        transcript,
        metadata: {
          interpretedQuantity: interpreted.interpretedQuantity,
          confidence: interpreted.confidence,
        },
      });
    } catch (voiceError) {
      setVoiceState("failed");
      setError(voiceError instanceof Error ? voiceError.message : "Voice quantity interpretation failed.");
      await logVoiceCountingEvent({
        eventType: "VOICE_FAILED",
        planId,
        countType,
        transcript,
      }).catch(() => undefined);
    }
  }

  async function startVoiceCapture() {
    if (!voiceConfig?.enabled) return;
    const browserWindow = window as Window & {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: ((event: { error: string }) => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: ((event: { error: string }) => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };

    const Recognition =
      browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setVoiceState("failed");
      setError("This browser does not expose a stable speech-recognition API. Use the transcript box or manual quantity entry.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = voiceConfig.locale;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setVoiceState("listening");
    setError(null);
    setVoiceInterpretation(null);
    await logVoiceCountingEvent({
      eventType: "VOICE_START",
      planId,
      countType,
      metadata: { locationId, itemId: validatedItem?.id ?? null },
    }).catch(() => undefined);

    recognition.onresult = async (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (!transcript) {
        setVoiceState("failed");
        setError("No quantity was recognized. Please try again or enter the quantity manually.");
        return;
      }
      await handleVoiceTranscriptInterpretation(transcript);
    };

    recognition.onerror = async (event) => {
      setVoiceState("failed");
      setError(`Voice capture failed: ${event.error}`);
      await logVoiceCountingEvent({
        eventType: "VOICE_FAILED",
        planId,
        countType,
        metadata: { error: event.error },
      }).catch(() => undefined);
    };

    recognition.onend = () => {
      setVoiceState((current) => (current === "listening" ? "idle" : current));
    };

    recognition.start();
  }

  async function applyVoiceQuantity() {
    if (!voiceInterpretation) return;
    setQuantity(String(voiceInterpretation.interpretedQuantity));
    setVoiceState("recognized");
    await logVoiceCountingEvent({
      eventType: "VOICE_CONFIRMED",
      planId,
      countType,
      transcript: voiceTranscript,
      metadata: {
        interpretedQuantity: voiceInterpretation.interpretedQuantity,
      },
    }).catch(() => undefined);
  }

  async function rejectVoiceQuantity() {
    setVoiceInterpretation(null);
    setVoiceState("idle");
    await logVoiceCountingEvent({
      eventType: "VOICE_REJECTED",
      planId,
      countType,
      transcript: voiceTranscript,
    }).catch(() => undefined);
  }

  async function handleDelete(entry: CountEntryRecord) {
    try {
      const result = await deleteCountEntry(planId, entry.id, countType, entry);
      await refreshEntries();
      setSaveMessage(result.pendingSync ? "Delete queued for sync." : "Count line deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete the count line.");
    }
  }

  if (isLoading) {
    return (
      <SectionCard title="Loading item count workspace">
        <div className="flex min-h-[260px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SectionCard>
    );
  }

  if (!plan || !locationId || !currentLocation) {
    return (
      <EmptyState
        title="Location context is required"
        description={error ?? "Start from the location scan step so item counting stays tied to a validated plan-scoped location."}
        action={
          <Button asChild>
            <Link href={`/stocktake/count/${planId}/location?countType=${countType}`}>Go to location scan</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Item Counting"
        description="Scan a valid item barcode, confirm its UOM, enter the counted quantity, and keep saving lines until the location is complete."
        actions={
          <Button variant="secondary" asChild>
            <Link href={`/stocktake/count/${planId}/review?countType=${countType}`}>Review saved entries</Link>
          </Button>
        }
      />

      <CountingContextBar
        plan={plan}
        countType={countType}
        locationLabel={`${currentLocation.code} | ${currentLocation.name}`}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_400px]">
        <div className="grid gap-6">
          <SectionCard title="Scan item barcode" description="The scanned barcode is validated against the inventory master and item UOM setup before you can save a line.">
            <div className="grid gap-4">
              <Input
                className="h-16 text-lg"
                placeholder="Scan or enter item barcode"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={handleItemValidation} disabled={isValidating || plan.submission.readOnly}>
                  {isValidating ? (
                    <>
                      Validating
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "Validate item"
                  )}
                </Button>
                <Button variant="secondary" asChild>
                  <Link href={`/stocktake/count/${planId}/location?countType=${countType}&locationId=${locationId}`}>
                    Change location
                  </Link>
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Current scanned item" description="Use large UOM chips and quantity entry tuned for repetitive tablet use on the warehouse floor.">
            {validatedItem ? (
              <div className="grid gap-5">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="text-sm text-muted-foreground">{validatedItem.code}</div>
                  <div className="mt-2 text-2xl font-semibold">{validatedItem.description}</div>
                </div>
                <div className="grid gap-3">
                  <div className="text-sm font-semibold text-muted-foreground">Select UOM</div>
                  <div className="flex flex-wrap gap-3">
                    {validatedItem.uoms.map((uom) => (
                      <button
                        key={uom.id}
                        type="button"
                        onClick={() => setSelectedUomId(uom.id)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          selectedUomId === uom.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-white text-foreground"
                        }`}
                      >
                        {uom.uomCode}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 tablet:grid-cols-[220px_1fr]">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-16 text-center text-2xl font-semibold"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                  <Button size="lg" onClick={handleSave} disabled={isSaving || plan.submission.readOnly}>
                    {isSaving ? (
                      <>
                        Saving
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      "Save count line"
                    )}
                  </Button>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Voice quantity capture</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Optional voice mode for quantity capture. Manual entry always stays available.
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={voiceState === "listening" ? "default" : "secondary"}
                      onClick={startVoiceCapture}
                      disabled={plan.submission.readOnly}
                    >
                      {voiceState === "listening" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {voiceState === "listening" ? "Listening..." : "Use voice input"}
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          voiceState === "failed"
                            ? "danger"
                            : voiceState === "confirmation"
                              ? "warning"
                              : voiceState === "recognized"
                                ? "success"
                                : "outline"
                        }
                      >
                        {voiceState === "idle" && "Ready"}
                        {voiceState === "listening" && "Listening"}
                        {voiceState === "processing" && "Processing"}
                        {voiceState === "recognized" && "Recognized"}
                        {voiceState === "confirmation" && "Confirmation pending"}
                        {voiceState === "failed" && "Recognition failed"}
                      </Badge>
                      {voiceInterpretation ? (
                        <Badge variant="outline">
                          Confidence {Math.round(voiceInterpretation.confidence * 100)}%
                        </Badge>
                      ) : null}
                    </div>

                    <Textarea
                      value={voiceTranscript}
                      onChange={(event) => setVoiceTranscript(event.target.value)}
                      rows={3}
                      placeholder="Transcript preview appears here. You can also type a spoken quantity phrase and interpret it manually."
                    />

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleVoiceTranscriptInterpretation(voiceTranscript)}
                        disabled={!voiceTranscript.trim()}
                      >
                        <Waves className="h-4 w-4" />
                        Interpret transcript
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setVoiceTranscript("");
                          setVoiceInterpretation(null);
                          setVoiceState("idle");
                        }}
                      >
                        Clear voice state
                      </Button>
                    </div>

                    {voiceInterpretation ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="text-sm font-semibold text-foreground">
                          {voiceInterpretation.confirmationText}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Transcript: {voiceInterpretation.transcript}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Button type="button" onClick={applyVoiceQuantity}>
                            Confirm quantity
                          </Button>
                          <Button type="button" variant="secondary" onClick={rejectVoiceQuantity}>
                            Reject and correct
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                {validatedItem.snapshots.length ? (
                  <div className="rounded-2xl border border-border/70 bg-white p-4">
                    <div className="text-sm font-semibold text-muted-foreground">Snapshot reference</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {validatedItem.snapshots.map((snapshot) => (
                        <Badge key={snapshot.id} variant="outline">
                          {snapshot.uomCode}: {snapshot.quantity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No validated item yet. Scan a barcode to load item details and valid UOM options.
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Saved lines" description="Recent lines stay visible so the operator can confirm what was already captured before final submission.">
          <div className="grid gap-3">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
            ) : null}
            {saveMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{saveMessage}</div>
            ) : null}
            {entries.length === 0 ? (
              <div className="text-sm text-muted-foreground">No count lines saved yet for this count type.</div>
            ) : (
              entries.slice(0, 12).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-border/70 bg-white p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{entry.itemCode}</div>
                      <div className="text-sm text-muted-foreground">{entry.itemDescription}</div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {entry.locationCode} | {entry.uomCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold">{entry.countedQty}</div>
                      {entry.syncStatus === "local-pending" ? (
                        <Badge variant="warning" className="mt-2">
                          Pending sync
                        </Badge>
                      ) : null}
                      {!plan.submission.readOnly ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(entry)}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
