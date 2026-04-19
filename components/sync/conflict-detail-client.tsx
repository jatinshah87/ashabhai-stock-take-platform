"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getSyncConflict, resolveSyncConflict } from "@/lib/services/sync";
import { SyncConflictDetail } from "@/lib/types";

export function ConflictDetailClient({ conflictId }: { conflictId: string }) {
  const [conflict, setConflict] = useState<SyncConflictDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

  async function refresh() {
    const data = await getSyncConflict(conflictId);
    setConflict(data);
  }

  useEffect(() => {
    refresh()
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load conflict detail.");
      })
      .finally(() => setIsLoading(false));
  }, [conflictId]);

  async function handleResolve(action: "KEEP_LOCAL" | "KEEP_SERVER" | "MARK_REVIEW") {
    setIsResolving(true);
    setError(null);
    setMessage(null);
    try {
      await resolveSyncConflict(conflictId, { resolutionAction: action, notes });
      await refresh();
      setMessage(`Conflict action applied: ${action.replace(/_/g, " ")}`);
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : "Unable to resolve conflict.");
    } finally {
      setIsResolving(false);
    }
  }

  if (isLoading || !conflict) {
    return (
      <SectionCard title="Loading conflict detail">
        <div className="flex min-h-[260px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Conflict Detail"
        description="Compare local queued values against current server values and choose an auditable resolution path."
        actions={
          <Button variant="secondary" asChild>
            <Link href="/conflicts">Back to conflicts</Link>
          </Button>
        }
      />
      {message ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <SectionCard title="Conflict comparison" description={`${conflict.conflictType.replace(/_/g, " ")} on ${conflict.planCode}.`}>
          <div className="grid gap-5 tablet:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Local queued value</div>
              <pre className="mt-3 overflow-x-auto text-sm text-foreground">{JSON.stringify(conflict.localValue, null, 2)}</pre>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Server value</div>
              <pre className="mt-3 overflow-x-auto text-sm text-foreground">{JSON.stringify(conflict.serverValue, null, 2)}</pre>
            </div>
          </div>
          <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
            <div>Plan: {conflict.planCode}</div>
            <div>Count type: {conflict.countType}</div>
            <div>Item: {conflict.itemCode ?? "N/A"}</div>
            <div>Location: {conflict.locationCode ?? "N/A"}</div>
            <div>Status: {conflict.status}</div>
          </div>
        </SectionCard>

        <SectionCard title="Resolution actions" description="Every action is stored with user, time, and chosen outcome.">
          <div className="grid gap-4">
            <Textarea
              placeholder="Optional reviewer note"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-[140px]"
            />
            <Button onClick={() => handleResolve("KEEP_LOCAL")} disabled={isResolving}>Keep local value</Button>
            <Button variant="secondary" onClick={() => handleResolve("KEEP_SERVER")} disabled={isResolving}>
              Keep server value
            </Button>
            <Button variant="secondary" onClick={() => handleResolve("MARK_REVIEW")} disabled={isResolving}>
              Mark for review
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
