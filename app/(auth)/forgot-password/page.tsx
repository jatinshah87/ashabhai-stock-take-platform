import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      eyebrow="Credential support"
      title="Reset access for your role"
      description="UI-only password recovery flow prepared for later integration with enterprise identity and admin approval logic."
      footer={
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="reset-email">Registered email</Label>
          <Input id="reset-email" placeholder="auditor@ashabhai.co" />
        </div>
        <div className="rounded-3xl border border-border/70 bg-muted/40 p-5">
          <div className="flex items-start gap-3">
            <MailCheck className="mt-0.5 h-5 w-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              The production flow can later issue secure reset emails, notify administrators and enforce role-aware approval paths.
            </p>
          </div>
        </div>
        <Button className="h-14 rounded-2xl text-base">Send reset link</Button>
      </div>
    </AuthCard>
  );
}
