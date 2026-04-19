"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { CountingContextBar } from "@/components/counting/counting-context-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { getCountReview, getExecutionPlan } from "@/lib/services/counting";
import { CountReviewData, CountTypeCode, ExecutionPlanDetail } from "@/lib/types";

export function SubmittedClient({ planId }: { planId: string }) {
  const searchParams = useSearchParams();
  const countType = (searchParams.get("countType") as CountTypeCode | null) ?? "FIRST";
  const queued = searchParams.get("queued") === "1";
  const [plan, setPlan] = useState<ExecutionPlanDetail | null>(null);
  const [review, setReview] = useState<CountReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getExecutionPlan(planId, countType), getCountReview(planId, countType)])
      .then(([planData, reviewData]) => {
        if (active) {
          setPlan(planData);
          setReview(reviewData);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load submitted state.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [planId, countType]);

  if (isLoading) {
    return (
      <SectionCard title="Loading submitted state">
        <div className="flex min-h-[220px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SectionCard>
    );
  }

  if (!plan || !review) {
    return (
      <EmptyState
        title="Unable to load submitted count"
        description={error ?? "This submitted view is not available."}
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
        title="Count Submitted"
        description={
          queued
            ? "This submission was queued locally because the device is offline. It will lock on the server after the next successful sync."
            : "This count type is now locked. Entries remain visible for audit and review but can no longer be edited."
        }
        actions={
          <Button variant="secondary" asChild>
            <Link href="/stocktake/my-plans">Back to my plans</Link>
          </Button>
        }
      />
      {queued ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Submission is pending sync. Open Sync Status to retry when connectivity returns.
        </div>
      ) : null}
      <CountingContextBar plan={plan} countType={countType} />
      <SectionCard title="Submission summary" description="Read-only confirmation of the count you submitted for this plan and count type.">
        <div className="grid gap-4 tablet:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Entries</div>
            <div className="mt-2 text-2xl font-semibold">{review.summary.entryCount}</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Locations</div>
            <div className="mt-2 text-2xl font-semibold">{review.summary.locationCount}</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Submitted at</div>
            <div className="mt-2 text-sm font-semibold">
              {review.summary.submittedAt ? review.summary.submittedAt.replace("T", " ").slice(0, 16) : "Locked"}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
