"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { appNavigation, resolveRoleFromPathname } from "@/lib/mock-data";
import { AppRole } from "@/lib/types";
import { getStoredAppRole } from "@/lib/services/session";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/brand-mark";
import { Badge } from "@/components/ui/badge";

export function SidebarNav() {
  const pathname = usePathname();
  const [storedRole, setStoredRole] = useState<AppRole | null>(null);

  useEffect(() => {
    setStoredRole(getStoredAppRole());
  }, [pathname]);

  const role = storedRole ?? resolveRoleFromPathname(pathname);
  const items = appNavigation.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex h-full flex-col gap-6 rounded-r-[32px] bg-brand-gradient p-5 text-white shadow-panel tablet:p-6">
      <div className="rounded-[28px] border border-white/10 bg-white/10 p-5">
        <BrandMark />
        <p className="mt-4 text-sm leading-6 text-white/72">
          Enterprise stock take platform for warehouse, site and location-level control across audit and operations teams.
        </p>
      </div>

      <nav className="grid gap-2">
        <div className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
          Navigation
        </div>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-14 items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition hover:bg-white/10",
                isActive ? "bg-white/14 text-white shadow-soft" : "text-white/78",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-2xl border border-white/10 bg-white/10"
                />
              ) : null}
              <span className="relative z-10 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-xs font-bold tracking-[0.08em]">
                  {item.icon}
                </span>
                {item.title}
              </span>
              {item.badge ? (
                <Badge variant="outline" className="relative z-10 border-white/15 bg-white/10 text-white/70">
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[28px] border border-white/10 bg-white/10 p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
          Planning snapshot
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            ["11", "Sites"],
            ["147", "Locations"],
            ["08", "1st Count"],
            ["06", "2nd Count"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <div className="font-display text-2xl font-semibold">{value}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/55">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
