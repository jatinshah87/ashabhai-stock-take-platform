"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import { resolveRoleFromPathname, usersByRole } from "@/lib/mock-data";
import { AppRole } from "@/lib/types";
import { getStoredAppRole } from "@/lib/services/session";
import { RoleBadge } from "@/components/layout/role-badge";

export function UserProfileMenu() {
  const pathname = usePathname();
  const [storedRole, setStoredRole] = useState<AppRole | null>(null);

  useEffect(() => {
    setStoredRole(getStoredAppRole());
  }, [pathname]);

  const user = usersByRole[storedRole ?? resolveRoleFromPathname(pathname)];

  return (
    <button className="flex min-h-14 items-center gap-3 rounded-2xl border border-border/80 bg-white px-4 py-3 text-left shadow-soft transition hover:-translate-y-0.5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-white">
        {user.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">{user.name}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {user.location}
        </div>
      </div>
      <RoleBadge role={user.role} />
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
