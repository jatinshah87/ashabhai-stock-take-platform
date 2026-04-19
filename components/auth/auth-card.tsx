import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <Card className="w-full rounded-[32px]">
      <CardContent className="grid gap-8 p-8 tablet:p-10">
        <div className="grid gap-3">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/70">
            {eyebrow}
          </div>
          <div className="grid gap-2">
            <h2 className="text-4xl font-semibold leading-tight">{title}</h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
          </div>
        </div>
        {children}
        {footer}
      </CardContent>
    </Card>
  );
}
