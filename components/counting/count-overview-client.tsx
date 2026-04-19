"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CountingContextBar } from "@/components/counting/counting-context-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getExecutionPlan } from "@/lib/services/counting";
import { CountTypeCode, ExecutionPlanDetail } from "@/lib/types";

export function CountOverviewClient({ planId }: { planId: string }) {
  const searchParams = useSearchParams();
  const requestedCountType = (searchParams.get("countType") as CountTypeCode | null) ?? undefined;
  const [plan, setPlan] = useState<ExecutionPlanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getExecutionPlan(planId, requestedCountType)
      .then((data) => {
        if (active) {
          setPlan(data);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load count execution.");
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
  }, [planId, requestedCountType]);

  const activeCountType = useMemo(
    () => plan?.assignments.activeCountType ?? requestedCountType ?? "FIRST",
    [plan, requestedCountType],
  );

  if (isLoading) {
    return (
      <SectionCard title="Loading execution context">
        <div className="flex min-h-[260px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SectionCard>
    );
  }

  if (!plan || error) {
    return (
      <EmptyState
        title="Unable to load count execution"
        description={error ?? "The selected stock take plan could not be opened for execution."}
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
        title="Count Execution Workspace"
        description="Review scope, confirm whether you are working as first count or second count, and launch into barcode-led execution."
        actions={
          plan.assignments.assignmentTypes.map((type) => (
            <Button key={type} variant={type === activeCountType ? "default" : "secondary"} asChild>
              <Link href={`/stocktake/count/${planId}?countType=${type}`}>
                {type === "FIRST" ? "First Count" : "Second Count"}
              </Link>
            </Button>
          ))
        }
      />

      <CountingContextBar plan={plan} countType={activeCountType} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <SectionCard
          title="Execution instructions"
          description="The warehouse user must stay within scope, validate the location first, then scan items and save lines before final submission."
        >
          <div className="grid gap-4">
            <div className="text-sm leading-7 text-muted-foreground">{plan.instructions}</div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Audit note</div>
              <div className="mt-2 text-sm leading-7 text-foreground">{plan.notes}</div>
            </div>
            <div className="grid gap-3 tablet:grid-cols-2">
              {plan.sites.map((site) => (
                <div key={site.id} className="rounded-2xl border border-border/70 bg-white p-4">
                  <div className="font-semibold">{site.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{site.code}</div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Execution controls" description="Move through the warehouse count in the same sequence operators will follow on the floor.">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Submission state</div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={plan.submission.readOnly ? "warning" : "primary"}>
                  {plan.submission.readOnly ? "Read only" : "Ready to count"}
                </Badge>
                <span className="text-sm text-muted-foreground">{plan.submission.status}</span>
              </div>
            </div>
            <Button asChild size="lg">
              <Link href={`/stocktake/count/${planId}/location?countType=${activeCountType}`}>
                Start with location scan
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={`/stocktake/count/${planId}/review?countType=${activeCountType}`}>
                Review saved entries
              </Link>
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
