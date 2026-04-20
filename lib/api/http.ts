const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";
const API_BASE_LABEL = API_BASE_URL.replace(/\/api$/, "");
const ACCESS_TOKEN_COOKIE = "ashabhai_access_token";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path: string, searchParams?: Record<string, string | number | undefined>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & {
    searchParams?: Record<string, string | number | undefined>;
  },
): Promise<T> {
  const headers = await buildHeaders(init?.headers, true);
  let response: Response;

  try {
    response = await fetch(buildUrl(path, init?.searchParams), {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    throw new ApiError(
      `Backend API is unavailable. Verify the backend service is reachable at ${API_BASE_LABEL} and try again.`,
      503,
      error,
    );
  }

  const text = await response.text();
  const body = text ? tryParseJson(text) : null;

  if (!response.ok) {
    const bodyMessage =
      body && typeof body === "object" && "message" in body ? body.message : undefined;
    const message =
      (typeof bodyMessage === "string"
        ? bodyMessage
        : Array.isArray(bodyMessage)
          ? bodyMessage.join(", ")
          : undefined) ||
      response.statusText ||
      "Request failed";

    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export async function apiDownload(
  path: string,
  init?: RequestInit & {
    searchParams?: Record<string, string | number | undefined>;
  },
) {
  const headers = await buildHeaders(init?.headers, false);
  let response: Response;

  try {
    response = await fetch(buildUrl(path, init?.searchParams), {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    throw new ApiError(
      `Backend API is unavailable. Verify the backend service is reachable at ${API_BASE_LABEL} and try again.`,
      503,
      error,
    );
  }

  if (!response.ok) {
    const text = await response.text();
    const body = text ? tryParseJson(text) : null;
    const bodyMessage =
      body && typeof body === "object" && "message" in body ? body.message : undefined;

    throw new ApiError(
      (typeof bodyMessage === "string"
        ? bodyMessage
        : Array.isArray(bodyMessage)
          ? bodyMessage.join(", ")
          : undefined) || response.statusText || "Download failed",
      response.status,
      body,
    );
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  return {
    blob,
    filename: filenameMatch?.[1] ?? "report.xlsx",
  };
}

export function isBackendUnavailable(error: unknown) {
  return error instanceof ApiError && error.status === 503;
}

export function getApiBaseLabel() {
  return API_BASE_LABEL;
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function getAuthHeaders() {
  const headers: Record<string, string> = {};
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  const token = window.localStorage.getItem(ACCESS_TOKEN_COOKIE);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function buildHeaders(initHeaders?: HeadersInit, includeJson = false): Promise<Headers> {
  const headers = new Headers(initHeaders);
  const authHeaders = await getAuthHeaders();

  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  if (includeJson && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}
