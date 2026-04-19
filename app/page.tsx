"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDefaultRouteForStoredUser, hasStoredSession } from "@/lib/services/session";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(hasStoredSession() ? getDefaultRouteForStoredUser() : "/login");
  }, [router]);

  return null;
}
