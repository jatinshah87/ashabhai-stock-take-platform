"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavigation, resolveRoleFromPathname } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const role = resolveRoleFromPathname(pathname);
  const items = appNavigation.filter((item) => item.roles.includes(role));

  return (
    <div className="tablet:hidden">
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex min-w-max gap-2">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold shadow-soft",
                  isActive
                    ? "border-primary/20 bg-primary text-white"
                    : "border-border/80 bg-white text-muted-foreground",
                )}
              >
                <span className="text-[11px] font-bold tracking-[0.08em]">{item.icon}</span>
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
