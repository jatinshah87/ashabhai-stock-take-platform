"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function UsersError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load user management"
      description="The user directory or assignment reference data could not be loaded. If the backend is offline the screen now falls back automatically, otherwise try again."
      onRetry={reset}
    />
  );
}
