"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span>Ashabhai Platform</span>
      {parts.map((part) => (
        <span key={part} className="inline-flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          <span className="capitalize">{part.replace("-", " ")}</span>
        </span>
      ))}
    </div>
  );
}
