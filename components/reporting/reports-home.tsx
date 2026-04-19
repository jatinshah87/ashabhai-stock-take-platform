import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";

const cards = [
  {
    href: "/reports/first-vs-second",
    title: "First vs Second",
    description: "Mismatch analysis between submitted first and second count lines.",
  },
  {
    href: "/reports/system-vs-first",
    title: "System vs First",
    description: "Variance between snapshot stock and first submitted count.",
  },
  {
    href: "/reports/system-vs-second",
    title: "System vs Second",
    description: "Variance between snapshot stock and second submitted count.",
  },
  {
    href: "/reports/final-variance",
    title: "Final Variance",
    description: "Combined final reconciliation with severity and export support.",
  },
];

export function ReportsHome() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Reports & Reconciliation"
        description="Operational variance workspace for auditors, management reviews, and Excel-based business export."
      />
      <div className="grid gap-5 tablet:grid-cols-2">
        {cards.map((card) => (
          <SectionCard key={card.href} title={card.title} description={card.description}>
            <Button asChild>
              <Link href={card.href}>Open report</Link>
            </Button>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
