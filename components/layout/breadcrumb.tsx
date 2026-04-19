"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  admin: "Admin",
  analytics: "Analytics",
  anomalies: "Anomalies",
  auditor: "Auditor",
  calendar: "Calendar",
  conflicts: "Conflicts",
  count: "Count",
  counting: "Counting",
  management: "Management",
  "management-dashboard": "Management Dashboard",
  plans: "Plans",
  reports: "Reports",
  settings: "Settings",
  stocktake: "Stock Take",
  "sync-status": "Sync Status",
  users: "Users",
  warehouse: "Warehouse",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, index) => ({
    href: `/${parts.slice(0, index + 1).join("/")}`,
    label: LABELS[part] ?? toTitleCase(part),
  }));

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href="/" className="transition hover:text-foreground">
        Ashabhai Platform
      </Link>
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="inline-flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          {index === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="transition hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
