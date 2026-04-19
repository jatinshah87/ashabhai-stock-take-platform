"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-danger">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="grid gap-2">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
