import { Badge } from "@/components/ui/badge";
import { IntegrationJobStatus } from "@/lib/types";

export function IntegrationStatusBadge({ status }: { status: IntegrationJobStatus }) {
  if (status === "SUCCESS") return <Badge variant="success">Success</Badge>;
  if (status === "RUNNING") return <Badge variant="primary">Running</Badge>;
  if (status === "PARTIAL_SUCCESS") return <Badge variant="warning">Partial</Badge>;
  return <Badge variant="danger">Failed</Badge>;
}
