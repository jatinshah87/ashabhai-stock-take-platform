import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="secondary">Operational snapshot</Button>
            <Button variant="default">Open active plan</Button>
          </>
        }
      />
      {children}
    </div>
  );
}
