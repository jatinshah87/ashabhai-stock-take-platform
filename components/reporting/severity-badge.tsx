import { Badge } from "@/components/ui/badge";
import { VarianceSeverity } from "@/lib/types";

export function SeverityBadge({ severity }: { severity: VarianceSeverity | string }) {
  const value = severity.toLowerCase();
  if (value === "matched") return <Badge variant="success">Matched</Badge>;
  if (value === "low") return <Badge variant="primary">Low</Badge>;
  if (value === "medium") return <Badge variant="warning">Medium</Badge>;
  return <Badge variant="danger">High</Badge>;
}
