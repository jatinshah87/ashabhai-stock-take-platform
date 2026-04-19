import { Badge } from "@/components/ui/badge";
import { BusinessUserRole } from "@/lib/types";

export function RolePill({ role }: { role: BusinessUserRole }) {
  const variant = role === "Admin" ? "primary" : role === "Auditor" ? "warning" : "success";
  return <Badge variant={variant}>{role}</Badge>;
}
