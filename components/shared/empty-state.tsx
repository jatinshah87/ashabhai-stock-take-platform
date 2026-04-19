import { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Inbox className="h-8 w-8" />
        </div>
        <div className="grid gap-2">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
