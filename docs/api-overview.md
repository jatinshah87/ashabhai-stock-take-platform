# Ashabhai Stock Take API Overview

## Authentication

- `POST /api/auth/login`
  - Public
  - Rate limited
  - Returns `accessToken` and authenticated user profile

## Access Model

- `SYSTEM_ADMIN`
  - Full platform access
  - Required for user administration and ERP imports
- `AUDITOR`
  - Audit dashboards, reports, anomalies, conflicts, and plan oversight
- `WAREHOUSE_USER`
  - Assigned counting execution, sync visibility, and warehouse analytics
- `MANAGEMENT`
  - Executive analytics, reports, and anomaly visibility

## Core Modules

- `users`
- `master-data`
- `stock-take-plans`
- `inventory`
- `count-execution`
- `reports`
- `integration`
- `sync`
- `analytics`
- `anomalies`
- `voice`

## Error Response Shape

All backend failures return a structured JSON shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/stock-take-plans",
  "timestamp": "2026-04-19T12:00:00.000Z",
  "requestId": "uuid-or-forwarded-id",
  "details": {}
}
```

## Production Notes

- `AUTH_DEV_BYPASS` must be `false` in production
- `DATABASE_URL` is required in production
- `FRONTEND_URLS` must contain all allowed frontend origins
- login and import endpoints are rate limited
- import endpoints are admin-only
- frontend root access should route users through `/login`
