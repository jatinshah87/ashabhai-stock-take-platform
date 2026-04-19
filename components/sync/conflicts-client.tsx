"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { getSyncConflicts } from "@/lib/services/sync";
import { SyncConflictListItem } from "@/lib/types";

export function ConflictsClient() {
  const [conflicts, setConflicts] = useState<SyncConflictListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSyncConflicts()
      .then((data) => {
        setConflicts(data);
        setError(null);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load conflicts.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <SectionCard title="Loading conflicts">
        <div className="flex min-h-[260px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Sync Conflicts"
        description="Review queued warehouse transactions that could not be applied safely to the server."
      />
      {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">{error}</div> : null}
      <SectionCard title="Conflict list" description="Conflict type, plan, count type, item, location, and review state.">
        {conflicts.length ? (
          <div className="overflow-hidden rounded-3xl border border-border/80">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Conflict</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Count type</th>
                  <th className="px-4 py-3 font-medium">Item / location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map((conflict) => (
                  <tr key={conflict.id} className="border-t border-border/70">
                    <td className="px-4 py-4 font-medium">{conflict.conflictType.replace(/_/g, " ")}</td>
                    <td className="px-4 py-4">{conflict.planCode}</td>
                    <td className="px-4 py-4">{conflict.countType}</td>
                    <td className="px-4 py-4">
                      {conflict.itemCode ?? "Item"} / {conflict.locationCode ?? "Location"}
                    </td>
                    <td className="px-4 py-4">{conflict.status}</td>
                    <td className="px-4 py-4">{new Date(conflict.createdAt).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-4">
                      <Button variant="secondary" asChild>
                        <Link href={`/conflicts/${conflict.id}`}>Review</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            No sync conflicts are currently open.
          </div>
        )}
      </SectionCard>
    </div>
  );
}
