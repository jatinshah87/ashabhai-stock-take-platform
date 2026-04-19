import { Layers3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Layers3 className="h-8 w-8" />
          </div>
          <div className="grid gap-2">
            <h2 className="text-2xl font-semibold">Route framework ready</h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
