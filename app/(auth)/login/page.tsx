"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { businessUsers } from "@/lib/mock-data";
import { isBackendUnavailable } from "@/lib/api/http";
import { login } from "@/lib/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("harshil.patel@ashabhai.co");
  const [password, setPassword] = useState("ChangeMe@123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await login({ email, password });
      window.localStorage.setItem("ashabhai_access_token", response.accessToken);
      window.localStorage.setItem("ashabhai_current_user", JSON.stringify(response.user));

      const destination =
        response.user.role === "WAREHOUSE_USER"
          ? "/stocktake/my-plans"
          : response.user.role === "AUDITOR"
            ? "/auditor"
            : "/admin";

      router.push(destination);
      router.refresh();
    } catch (loginError) {
      if (isBackendUnavailable(loginError)) {
        const fallbackUser = businessUsers.find(
          (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
        );

        if (fallbackUser && password === "ChangeMe@123") {
          const roleCode =
            fallbackUser.role === "Admin"
              ? "SYSTEM_ADMIN"
              : fallbackUser.role === "Auditor"
                ? "AUDITOR"
                : "WAREHOUSE_USER";
          const demoUser = {
            id: fallbackUser.id,
            name: fallbackUser.name,
            email: fallbackUser.email,
            role: roleCode,
            warehouseIds: [fallbackUser.warehouseId],
            siteIds: fallbackUser.siteIds,
          };
          window.localStorage.setItem("ashabhai_access_token", "demo-offline-session");
          window.localStorage.setItem("ashabhai_current_user", JSON.stringify(demoUser));
          router.push(roleCode === "WAREHOUSE_USER" ? "/stocktake/my-plans" : roleCode === "AUDITOR" ? "/auditor" : "/admin");
          router.refresh();
          return;
        }
      }

      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Secure access"
      title="Sign in to warehouse operations"
      description="Use your assigned role credentials to access stock take dashboards, audit oversight and warehouse counting workflows."
      footer={
        <p className="text-sm text-muted-foreground">
          Need help signing in?{" "}
          <Link href="/forgot-password" className="font-semibold text-primary">
            Reset password
          </Link>
        </p>
      }
    >
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            placeholder="operations@ashabhai.co"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary">
              Forgot password
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 rounded-3xl border border-border/70 bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-success" />
            <p className="text-sm leading-6 text-muted-foreground">
              This device mode is optimized for warehouse tablets, supervisor review stations and audit desks.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Role access determines what modules, dashboards and approvals are visible after sign in.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-white/80 p-3 text-sm text-muted-foreground">
            Seeded local login: <span className="font-semibold text-foreground">harshil.patel@ashabhai.co</span> with password <span className="font-semibold text-foreground">ChangeMe@123</span>
          </div>
        </div>

        <Button
          className="h-14 justify-between rounded-2xl px-5 text-base"
          disabled={isSubmitting}
          onClick={handleLogin}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </AuthCard>
  );
}
