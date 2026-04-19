import { AppRole, AuthenticatedUser } from "@/lib/types";

export function getStoredUser(): AuthenticatedUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("ashabhai_current_user");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthenticatedUser;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("ashabhai_access_token");
  window.localStorage.removeItem("ashabhai_current_user");
}

export function getStoredAppRole(): AppRole | null {
  const user = getStoredUser();
  if (!user) return null;
  if (user.role === "SYSTEM_ADMIN") return "system-admin";
  if (user.role === "AUDITOR") return "auditor";
  if (user.role === "WAREHOUSE_USER") return "warehouse-user";
  if (user.role === "MANAGEMENT") return "management";
  return null;
}
