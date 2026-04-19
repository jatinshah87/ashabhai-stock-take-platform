import { ActivityItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const toneMap = {
  default: "outline",
  success: "success",
  warning: "warning",
  danger: "danger",
} as const;

export function ActivityList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: ActivityItem[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-[24px] border border-border/70 bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1">
                <div className="font-semibold text-foreground">{item.title}</div>
                <div className="text-sm leading-6 text-muted-foreground">{item.subtitle}</div>
              </div>
              <Badge variant={toneMap[item.tone]}>{item.meta}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
