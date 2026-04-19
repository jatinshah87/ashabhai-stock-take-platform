import { apiFetch, isBackendUnavailable } from "@/lib/api/http";
import { IntegrationJobsResponse } from "@/lib/types";

export async function getIntegrationJobs(limit = 12): Promise<IntegrationJobsResponse & { backendUnavailable?: boolean }> {
  try {
    return await apiFetch<IntegrationJobsResponse>("/integration/jobs", {
      searchParams: { limit },
    });
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    return {
      jobs: [],
      latestSnapshotImport: null,
      backendUnavailable: true,
    };
  }
}
