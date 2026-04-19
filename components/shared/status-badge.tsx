import { Badge } from "@/components/ui/badge";
import { EntityStatus, PlanStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: EntityStatus | PlanStatus }) {
  const normalized = status.toLowerCase();

  if (normalized === "active" || normalized === "completed") {
    return <Badge variant="success">{status}</Badge>;
  }

  if (normalized === "inactive" || normalized === "draft") {
    return <Badge variant="outline">{status}</Badge>;
  }

  if (normalized === "scheduled") {
    return <Badge variant="primary">{status}</Badge>;
  }

  if (normalized === "in progress") {
    return <Badge variant="warning">{status}</Badge>;
  }

  return <Badge variant="danger">{status}</Badge>;
}
