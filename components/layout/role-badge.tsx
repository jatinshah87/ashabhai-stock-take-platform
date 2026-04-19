import { Shield, UserCog, ClipboardCheck, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppRole } from "@/lib/types";

const roleMap: Record<AppRole, { label: string; icon: typeof Shield }> = {
  "system-admin": { label: "System Admin", icon: UserCog },
  auditor: { label: "Auditor", icon: ClipboardCheck },
  "warehouse-user": { label: "Warehouse User", icon: Warehouse },
  management: { label: "Management", icon: Shield },
};

export function RoleBadge({ role }: { role: AppRole }) {
  const item = roleMap[role];
  const Icon = item.icon;

  return (
    <Badge variant="primary" className="gap-2 px-3 py-1.5 text-xs">
      <Icon className="h-3.5 w-3.5" />
      {item.label}
    </Badge>
  );
}
