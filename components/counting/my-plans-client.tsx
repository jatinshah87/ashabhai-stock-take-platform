"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, LoaderCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyAssignedPlans } from "@/lib/services/counting";
import { getStoredUser } from "@/lib/services/session";
import { AssignedExecutionPlan, CountTypeCode } from "@/lib/types";

function toCountLabel(type: CountTypeCode) {
  return type === "FIRST" ? "First Count" : "Second Count";
}

export function MyPlansClient() {
  const [plans, setPlans] = useState<AssignedExecutionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getStoredUser();

  useEffect(() => {
    let active = true;

    getMyAssignedPlans()
      .then((data) => {
        if (active) {
          setPlans(data);
          setError(null);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load assigned plans.");
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
  }, []);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="My Stock Take Plans"
        description="Open your assigned first or second count work, track what has already been submitted, and launch into warehouse execution without leaving the tablet workspace."
      />

      {!user ? (
        <EmptyState
          title="Sign in as an assigned warehouse or audit user"
          description="The execution workspace uses the live login session to determine which plans and count types you are allowed to perform."
          action={
            <Button asChild>
              <Link href="/login">Go to login</Link>
            </Button>
          }
        />
      ) : isLoading ? (
        <SectionCard title="Loading assigned work">
          <div className="flex min-h-[220px] items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SectionCard>
      ) : error ? (
        <EmptyState
          title="Unable to load assigned plans"
          description={error}
          action={
            <Button asChild>
              <Link href="/stocktake/my-plans">Retry</Link>
            </Button>
          }
        />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No assigned count plans"
          description="There are no active first-count or second-count assignments for this login yet."
        />
      ) : (
        <div className="grid gap-5">
          {plans.map((plan) => (
            <SectionCard
              key={plan.id}
              title={plan.name}
              description={`${plan.code} | ${plan.warehouse.name} | ${plan.scheduledDate} | ${plan.scheduleWindow}`}
              actions={<StatusBadge status={plan.status} />}
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_420px]">
                <div className="grid gap-4">
                  <div className="text-sm leading-7 text-muted-foreground">{plan.description}</div>
                  <div className="grid gap-3 tablet:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Sites</div>
                      <div className="mt-2 text-2xl font-semibold">{plan.sites.length}</div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Locations</div>
                      <div className="mt-2 text-2xl font-semibold">{plan.locations.length}</div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Plan lock</div>
                      <div className="mt-2 text-lg font-semibold">{plan.locked ? "Locked" : "Open"}</div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {plan.progress.map((progress) => (
                    <div key={progress.countType} className="rounded-2xl border border-border/70 bg-white p-4 shadow-soft">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant={progress.submitted ? "success" : "primary"}>
                          {toCountLabel(progress.countType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {progress.entryCount}/{progress.locationScopeCount} lines
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        {progress.submitted
                          ? `Submitted ${progress.submittedAt?.slice(0, 10) ?? ""}`
                          : "Open for warehouse counting"}
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button asChild className="flex-1">
                          <Link href={`/stocktake/count/${plan.id}?countType=${progress.countType}`}>
                            {progress.readOnly ? "Open read-only" : "Open count"}
                          </Link>
                        </Button>
                        <Button variant="secondary" asChild>
                          <Link href={`/stocktake/count/${plan.id}/review?countType=${progress.countType}`}>
                            <ClipboardList className="h-4 w-4" />
                            Review
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
