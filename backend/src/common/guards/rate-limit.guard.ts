import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from "@nestjs/common";

type Bucket = {
  count: number;
  expiresAt: number;
};

const buckets = new Map<string, Bucket>();

abstract class BaseRateLimitGuard implements CanActivate {
  protected abstract readonly limit: number;
  protected abstract readonly ttlMs: number;
  protected abstract readonly namespace: string;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      ip?: string;
      route?: { path?: string };
    }>();

    const ip = getIpAddress(request);
    const route = request.route?.path ?? this.namespace;
    const key = `${this.namespace}:${route}:${ip}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.expiresAt <= now) {
      buckets.set(key, { count: 1, expiresAt: now + this.ttlMs });
      return true;
    }

    if (current.count >= this.limit) {
      throw new HttpException("Too many requests. Please retry shortly.", 429);
    }

    current.count += 1;
    buckets.set(key, current);
    return true;
  }
}

@Injectable()
export class LoginRateLimitGuard extends BaseRateLimitGuard {
  protected readonly limit = 10;
  protected readonly ttlMs = 15 * 60 * 1000;
  protected readonly namespace = "auth-login";
}

@Injectable()
export class AdminImportRateLimitGuard extends BaseRateLimitGuard {
  protected readonly limit = 30;
  protected readonly ttlMs = 5 * 60 * 1000;
  protected readonly namespace = "admin-import";
}

function getIpAddress(request: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}) {
  const forwarded = request.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) {
    return forwarded[0] ?? "unknown";
  }
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.ip ?? "unknown";
}
