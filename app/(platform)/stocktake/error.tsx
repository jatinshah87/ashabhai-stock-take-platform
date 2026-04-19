"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function StockTakeError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load stock take planning"
      description="Planning data could not be loaded. If the backend is offline the planning pages fall back automatically, otherwise try again to restore the workspace."
      onRetry={reset}
    />
  );
}
