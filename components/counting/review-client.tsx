"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { CountingContextBar } from "@/components/counting/counting-context-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getCountReview, getExecutionPlan, submitCount } from "@/lib/services/counting";
import { CountReviewData, CountTypeCode, ExecutionPlanDetail } from "@/lib/types";

export function ReviewClient({ planId }: { planId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const countType = (searchParams.get("countType") as CountTypeCode | null) ?? "FIRST";
  const [plan, setPlan] = useState<ExecutionPlanDetail | null>(null);
  const [review, setReview] = useState<CountReviewData | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(window.navigator.onLine);
    const handler = () => setIsOnline(window.navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getExecutionPlan(planId, countType), getCountReview(planId, countType)])
      .then(([planData, reviewData]) => {
        if (active) {
          setPlan(planData);
          setReview(reviewData);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load count review.");
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

  async function handleSubmit() {
    if (!review || review.summary.readOnly) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitCount(planId, { countType, notes });
      router.push(
        result.pendingSync
          ? `/sync-status?queuedSubmission=1`
          : `/stocktake/count/${planId}/submitted?countType=${countType}`,
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit count.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <SectionCard title="Loading review workspace">
        <div className="flex min-h-[260px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SectionCard>
    );
  }

  if (!plan || !review) {
    return (
      <EmptyState
        title="Unable to load count review"
        description={error ?? "The review workspace could not be opened."}
        action={
          <Button asChild>
            <Link href="/stocktake/my-plans">Back to my plans</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Review and Submit"
        description="Review grouped count lines before sealing this count type. After submission the count becomes read-only."
        actions={
          <Button variant="secondary" asChild>
            <Link href={`/stocktake/count/${planId}/item?countType=${countType}`}>Back to count</Link>
          </Button>
        }
      />

      <CountingContextBar plan={plan} countType={countType} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <SectionCard title="Grouped review" description="Saved lines are grouped by location so the operator or auditor can check completion before final submission.">
          <div className="grid gap-4">
            {review.groups.length === 0 ? (
              <div className="text-sm text-muted-foreground">No count lines exist yet for this count type.</div>
            ) : (
              review.groups.map((group) => (
                <div key={group.locationId} className="rounded-2xl border border-border/70 bg-white p-4">
                  <div className="font-semibold">{group.locationCode} | {group.locationName}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{group.entryCount} lines captured</div>
                  <div className="mt-3 grid gap-2">
                    {group.lines.map((line) => (
                      <div key={line.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/20 px-3 py-2 text-sm">
                        <span>{line.itemCode} | {line.uomCode}</span>
                        <span className="font-semibold">{line.countedQty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Submission control" description="Submission locks the selected count type permanently and prevents further editing.">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              {review.summary.entryCount} lines across {review.summary.locationCount} locations.
            </div>
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
            ) : null}
            <Textarea
              placeholder="Optional submission note"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-[120px]"
              disabled={review.summary.readOnly}
            />
            <Button size="lg" onClick={handleSubmit} disabled={review.summary.readOnly || isSubmitting || review.summary.entryCount === 0}>
              {review.summary.readOnly
                ? "Already submitted"
                : isSubmitting
                  ? "Submitting..."
                  : isOnline
                    ? "Submit final count"
                    : "Queue final submission"}
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
