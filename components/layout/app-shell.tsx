import type { ReactNode } from "react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumb";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SyncShellStatus } from "@/components/sync/sync-shell-status";
import { UserProfileMenu } from "@/components/layout/user-profile-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell tablet:grid tablet:grid-cols-[300px_minmax(0,1fr)]">
      <div className="hidden min-h-screen tablet:block">
        <SidebarNav />
      </div>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 px-4 py-4 backdrop-blur tablet:px-8 tablet:py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid gap-2">
              <Breadcrumbs />
              <div className="flex flex-wrap items-center gap-3">
                <SyncShellStatus />
                <Badge variant="primary" className="px-3 py-1.5">
                  Shift 14:00 - 22:00
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
              <Button variant="secondary" className="h-12">
                Export brief
              </Button>
              <UserProfileMenu />
            </div>
          </div>
          <MobileNav />
        </header>

        <main className="flex-1 px-4 py-6 tablet:px-8 tablet:py-8">{children}</main>
      </div>
    </div>
  );
}
