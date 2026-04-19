import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-hero-grid px-4 py-8 tablet:px-8 tablet:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <div className="grid w-full gap-6 tablet:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden rounded-[32px] bg-brand-gradient p-10 text-white shadow-panel tablet:flex tablet:flex-col tablet:justify-between">
            <div>
              <div className="mb-8 rounded-[28px] bg-white px-6 py-4 shadow-soft">
                <Image
                  src="/ashabhai-logo.svg"
                  alt="Ashabhai & Co. logo"
                  width={300}
                  height={100}
                  className="h-auto w-full"
                  priority
                />
              </div>
              <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/80">
                Stock Take Operations Platform
              </div>
              <h1 className="max-w-xl font-display text-5xl font-semibold leading-tight text-white">
                Enterprise warehouse counting for audit control, location accuracy and disciplined execution.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/78">
                Built for Ashabhai distribution operations with warehouse, site and location-level planning before floor execution begins.
              </p>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/10 p-6">
              <div className="text-sm uppercase tracking-[0.18em] text-white/60">
                Planning Readiness Snapshot
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  ["11", "Sites"],
                  ["147", "Locations"],
                  ["08", "First Counts"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="text-2xl font-display font-semibold">{value}</div>
                    <div className="mt-1 text-sm text-white/72">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center">{children}</div>
        </div>
      </div>
    </div>
  );
}
