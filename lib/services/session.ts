import { AppRole, AuthenticatedUser } from "@/lib/types";

const ACCESS_TOKEN_KEY = "ashabhai_access_token";
const CURRENT_USER_KEY = "ashabhai_current_user";

export function getStoredUser(): AuthenticatedUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
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

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function hasStoredSession() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    window.localStorage.getItem(ACCESS_TOKEN_KEY) &&
      window.localStorage.getItem(CURRENT_USER_KEY),
  );
}

export function storeSession(accessToken: string, user: AuthenticatedUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(accessToken)}; path=/; max-age=28800; SameSite=Lax${secure}`;
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

export function getDefaultRouteForStoredUser() {
  const role = getStoredAppRole();
  if (!role) return "/login";
  if (role === "warehouse-user") return "/warehouse";
  if (role === "auditor") return "/auditor";
  if (role === "management") return "/management-dashboard";
  return "/admin";
}
