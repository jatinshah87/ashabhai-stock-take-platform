import { IntegrationMonitor } from "@/components/integration/integration-monitor";
import { getIntegrationJobs } from "@/lib/services/integration";

export default async function IntegrationSettingsPage() {
  const data = await getIntegrationJobs();

  return <IntegrationMonitor data={data} backendUnavailable={data.backendUnavailable} />;
}
