"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, MapPinned } from "lucide-react";
import { CountingContextBar } from "@/components/counting/counting-context-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getExecutionPlan, validateLocationBarcode } from "@/lib/services/counting";
import { CountTypeCode, ExecutionPlanDetail, ValidatedLocation } from "@/lib/types";

export function LocationScanClient({ planId }: { planId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const countType = (searchParams.get("countType") as CountTypeCode | null) ?? "FIRST";
  const [plan, setPlan] = useState<ExecutionPlanDetail | null>(null);
  const [barcode, setBarcode] = useState("");
  const [validatedLocation, setValidatedLocation] = useState<ValidatedLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    let active = true;
    getExecutionPlan(planId, countType)
      .then((data) => {
        if (active) {
          setPlan(data);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load plan context.");
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

  const locationInQuery = useMemo(() => {
    if (!plan) return null;
    const locationId = searchParams.get("locationId");
    return plan.locations.find((item) => item.id === locationId) ?? null;
  }, [plan, searchParams]);

  async function handleValidate() {
    if (!barcode.trim()) return;
    setIsValidating(true);
    setError(null);

    try {
      const location = await validateLocationBarcode(planId, { countType, barcode: barcode.trim() });
      setValidatedLocation(location);
    } catch (validateError) {
      setError(validateError instanceof Error ? validateError.message : "Location validation failed.");
      setValidatedLocation(null);
    } finally {
      setIsValidating(false);
    }
  }

  if (isLoading) {
    return (
      <SectionCard title="Loading location validation">
        <div className="flex min-h-[260px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SectionCard>
    );
  }

  if (!plan || error === "You do not have access to this stock take plan") {
    return (
      <EmptyState
        title="Unable to open location scan"
        description={error ?? "This execution workspace is not available."}
        action={
          <Button asChild>
            <Link href="/stocktake/my-plans">Back to my plans</Link>
          </Button>
        }
      />
    );
  }

  const selected = validatedLocation
    ? `${validatedLocation.code} | ${validatedLocation.name}`
    : locationInQuery
      ? `${locationInQuery.code} | ${locationInQuery.name}`
      : undefined;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Scan Location"
        description="Validate the physical location barcode before any item is counted. Only locations inside the selected plan scope are accepted."
        actions={
          <Button variant="secondary" asChild>
            <Link href={`/stocktake/count/${planId}?countType=${countType}`}>Back to overview</Link>
          </Button>
        }
      />

      <CountingContextBar plan={plan} countType={countType} locationLabel={selected} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <SectionCard title="Location barcode" description="Use the tablet scanner or enter the barcode manually if handheld input is not available.">
          <div className="grid gap-4">
            <Input
              className="h-16 text-lg"
              placeholder="Scan or enter location barcode"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
            />
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={handleValidate} disabled={isValidating}>
                {isValidating ? (
                  <>
                    Validating
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "Validate location"
                )}
              </Button>
              {validatedLocation ? (
                <Button asChild variant="secondary" size="lg">
                  <Link
                    href={`/stocktake/count/${planId}/item?countType=${countType}&locationId=${validatedLocation.id}`}
                  >
                    Continue to item count
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Validated location" description="Once validated, this location becomes the active context for barcode item entry.">
          {validatedLocation ? (
            <div className="grid gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <MapPinned className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">{validatedLocation.code}</div>
                    <div className="text-sm text-muted-foreground">{validatedLocation.name}</div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Aisle {validatedLocation.aisle} | Zone {validatedLocation.zone}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No location validated yet. The item screen stays unavailable until a valid plan-scoped barcode is scanned.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
