import Link from "next/link";
import { ArrowRight, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Settings & Governance"
        description="Administrative controls for system configuration, operational governance, and enterprise integrations."
      />

      <div className="grid gap-5 tablet:grid-cols-2">
        <SectionCard
          title="QAD Integration Monitor"
          description="Review recent import jobs, stock snapshot refreshes, and record-level ERP exceptions."
          actions={<Settings2 className="h-5 w-5 text-primary" />}
        >
          <Button asChild>
            <Link href="/settings/integration">
              Open integration monitor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </SectionCard>
      </div>
    </div>
  );
}
