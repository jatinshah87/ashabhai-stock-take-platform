import type { ReactNode } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { AppShell } from "@/components/layout/app-shell";

export default function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionGate>
      <AppShell>{children}</AppShell>
    </SessionGate>
  );
}
