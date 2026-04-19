# Ashabhai & Co. Stock Take Application

This repository now includes the branded Next.js frontend, NestJS backend, Prisma/PostgreSQL data model, database-backed operational stock take execution workflow, API-driven variance reporting with Excel export, QAD-ready ERP import foundations, and an offline-first sync/conflict management layer.

## Frontend stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- lucide-react
- Framer Motion
- Recharts

## Backend stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- class-validator DTO validation

## Delivered through Phase 7

- Ashabhai-branded app shell and tablet-first frontend
- Auth, RBAC, user management, warehouse/site/location hierarchy, and stock take planning
- Inventory master with items, barcodes, UOMs, and stock snapshots
- Assigned plan execution APIs for warehouse users and assigned auditors
- Location barcode validation
- Item barcode validation with valid UOM options
- Count entry save, update, delete, review, and final submission
- First count and second count isolation
- Submission locking and read-only behavior after submit
- Variance reporting engine for:
  - First Count vs Second Count
  - System Stock vs First Count
  - System Stock vs Second Count
  - Combined Final Variance
- KPI summary APIs and Excel export endpoints
- QAD-ready import endpoints for warehouse, site, location, item, item barcode, item UOM, and stock snapshot data
- Import job logging with inserted, updated, skipped, failed summaries and record-level exceptions
- Admin integration monitoring route for recent import health visibility
- Offline-first device queue storage for count save, delete, and submission actions
- Sync batch ingestion APIs with per-record processing results
- Conflict detection for duplicate lines, plan locks, submission mismatches, out-of-scope references, and stale server state
- Conflict resolution APIs and frontend review screens
- Sync monitoring route for queue, retry, and conflict visibility
- Seed data for realistic local testing

## Backend modules

- `backend/src/auth`
  JWT login and seeded credential support
- `backend/src/users`
  User list, detail, create, update, and status management
- `backend/src/master-data`
  Warehouses, sites, locations, and hierarchy APIs
- `backend/src/stock-take-plans`
  Planning CRUD and calendar APIs
- `backend/src/inventory`
  Items, barcode lookup, UOMs, and stock snapshots
- `backend/src/count-execution`
  Assigned plans, validation, count entry, review, submission, and lock enforcement
- `backend/src/reports`
  Variance calculation, KPI summaries, filterable report endpoints, and Excel export
- `backend/src/integration`
  ERP/QAD import endpoints, idempotent upsert services, import job logs, and integration monitoring support
- `backend/src/sync`
  Offline sync queue ingestion, conflict detection, resolution workflows, and sync summary APIs
- `backend/src/audit-log`
  Login, user, planning, validation, count, submission, lock, reporting, export, integration, sync, and conflict audit events

## Prisma schema additions in Phase 4

- Enums:
  - `CountType`
  - `SubmissionStatus`
- Models:
  - `Item`
  - `ItemBarcode`
  - `ItemUOM`
  - `StockSnapshot`
  - `CountEntry`
  - `CountSubmission`

Phase 5 uses on-demand variance calculation in the reporting service, so no additional Prisma models were required for reporting yet.

Phase 6 adds:

- Enums:
  - `ImportJobStatus`
  - `ImportType`
  - `ImportRecordStatus`
- Models:
  - `ImportJob`
  - `ImportJobDetail`
- `StockSnapshot.sourceReference`
- A unique stock snapshot key on warehouse, site, location, item, UOM, and snapshot timestamp for safe repeated imports

Phase 7 adds:

- Enums:
  - `SyncStatus`
  - `SyncActionType`
  - `ConflictType`
  - `ConflictStatus`
  - `ConflictResolutionAction`
- Models:
  - `SyncQueue`
  - `SyncConflict`

## Frontend routes connected

- `/stocktake/my-plans`
- `/stocktake/count/[planId]`
- `/stocktake/count/[planId]/location`
- `/stocktake/count/[planId]/item`
- `/stocktake/count/[planId]/review`
- `/stocktake/count/[planId]/submitted`
- `/reports`
- `/reports/first-vs-second`
- `/reports/system-vs-first`
- `/reports/system-vs-second`
- `/reports/final-variance`
- `/settings`
- `/settings/integration`
- `/sync-status`
- `/conflicts`
- `/conflicts/[id]`

## Environment variables

### Frontend `.env.local`

Use [`.env.example`](./.env.example) as the starting point:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

### Backend `backend/.env`

Use [`backend/.env.example`](./backend/.env.example) as the starting point:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ashabhai_stock_take?schema=public
JWT_SECRET=change-this-for-production
JWT_EXPIRES_IN=8h
PORT=4000
FRONTEND_URL=http://localhost:3000
AUTH_DEV_BYPASS=true
DEFAULT_USER_PASSWORD=ChangeMe@123
```

## Database migration and seed steps

1. Create a PostgreSQL database named `ashabhai_stock_take`.
2. Open a terminal in `backend`.
3. Install backend packages:
   `npm install`
4. Generate Prisma client:
   `npm run prisma:generate`
5. Apply migrations:
   `npm run prisma:migrate`
6. Seed realistic test data:
   `npm run prisma:seed`

## Local run instructions

### Backend

1. Open a terminal in:
   `C:\Users\Jatin\Downloads\Codex\Stock take Application\backend`
2. Run:
   `npm install`
3. Start the API:
   `npm run start:dev`

Backend URL:
[http://localhost:4000/api](http://localhost:4000/api)

### Frontend

1. Open a terminal in:
   `C:\Users\Jatin\Downloads\Codex\Stock take Application`
2. Run:
   `npm install`
3. Start the frontend:
   `npm run dev`

Frontend URL:
[http://localhost:3000](http://localhost:3000)

## Seed users for local testing

All seeded users use the default password:
`ChangeMe@123`

Recommended local execution tests:

- Admin:
  - `harshil.patel@ashabhai.co`
- Auditor / second-count capable:
  - `meera.shah@ashabhai.co`
  - `rina.desai@ashabhai.co`
- Warehouse users:
  - `jignesh.parmar@ashabhai.co`
  - `nirali.dave@ashabhai.co`
  - `priya.chauhan@ashabhai.co`

## Suggested Phase 5 test paths

### First count open flow

- Sign in as `jignesh.parmar@ashabhai.co`
- Open `/stocktake/my-plans`
- Use plan `FY26 Ahmedabad Annual Stock Take`
- Open `First Count`
- Validate a location barcode such as `LOC-A1-01`
- Validate an item barcode such as `ITEM-TEA-500G`
- Save quantity lines and review them
- Submit final count and confirm the route becomes read-only

### Second count open flow

- Sign in as `jignesh.parmar@ashabhai.co`
- Open plan `Rajkot Audit Sample Count`
- Open `Second Count`
- Validate a location barcode such as `LOC-A2-01`
- Count using `ITEM-TEA-500G` or `ITEM-COF-200G`
- Submit and confirm read-only behavior

### Submitted read-only flow

- Sign in as `meera.shah@ashabhai.co`
- Review the completed historical plan from the submitted route
- Confirm entries are visible but no longer editable

### Reporting and Excel export

- Sign in as `harshil.patel@ashabhai.co` or `meera.shah@ashabhai.co`
- Open `/reports`
- Validate:
  - `/reports/first-vs-second`
  - `/reports/system-vs-first`
  - `/reports/system-vs-second`
  - `/reports/final-variance`
- Use plan, warehouse, site, location, severity, and item code filters
- Confirm KPI cards update with the filtered data
- Use `Export Excel` on each report and confirm the downloaded workbook opens with business-ready headers

### Integration imports and monitoring

- Sign in as `harshil.patel@ashabhai.co`
- Open `/settings/integration`
- Confirm the monitor loads and shows recent import jobs once imports are executed

Example warehouse import:

```json
{
  "sourceSystem": "QAD",
  "sourceLabel": "Warehouse master refresh",
  "records": [
    {
      "code": "BLR-DC",
      "name": "Bangalore Distribution Center",
      "city": "Bengaluru",
      "region": "South India",
      "status": "active"
    }
  ]
}
```

Example stock snapshot import:

```json
{
  "sourceSystem": "QAD",
  "sourceLabel": "Nightly stock snapshot",
  "records": [
    {
      "warehouseCode": "AHD-DC",
      "siteCode": "A1",
      "locationCode": "A1-01",
      "itemCode": "ITM-10001",
      "uomCode": "PCS",
      "quantity": 144,
      "snapshotAt": "2026-04-18T05:30:00.000Z",
      "sourceReference": "QAD-SNAP-20260418-001"
    }
  ]
}
```

Suggested local API calls:

- `POST /api/integration/warehouses/import`
- `POST /api/integration/sites/import`
- `POST /api/integration/locations/import`
- `POST /api/integration/items/import`
- `POST /api/integration/item-barcodes/import`
- `POST /api/integration/item-uoms/import`
- `POST /api/integration/stock-snapshots/import`
- `GET /api/integration/jobs`
- `GET /api/integration/jobs/:id`

### Offline sync and conflicts

- Create or delete count lines while the backend is unavailable to populate the browser queue
- Open `/sync-status` to confirm pending local actions are visible
- Restore connectivity and use `Retry sync`
- Open `/conflicts` to review any server-side conflicts
- Resolve a conflict from `/conflicts/[id]`

Suggested conflict tests:

- Duplicate line conflict:
  Save a count line online, then queue another create for the same plan, count type, location, and item while offline with a different quantity.
- Plan locked conflict:
  Queue a count line offline, complete and lock the plan on the server, then reconnect and retry sync.
- Submission conflict:
  Queue a submission offline, submit the same count type on another device or directly on the server, then reconnect.
- Server state mismatch:
  Queue an update or delete offline, modify the same line on the server before reconnect, then retry sync.
- Out-of-scope or invalid reference:
  Send a sync batch payload with a location or item outside the plan scope.

Sync endpoints added:

- `POST /api/sync/batch`
- `GET /api/sync/queue`
- `GET /api/sync/queue/:id`
- `GET /api/sync/conflicts`
- `GET /api/sync/conflicts/:id`
- `POST /api/sync/conflicts/:id/resolve`
- `GET /api/sync/summary`

## Notes

- The frontend stores the JWT token in local browser storage for client-side execution routes.
- User management and planning pages now fall back to local demo data if the backend is unavailable, so the UI remains accessible during local setup.
- Variance reports require the backend and database because they are calculated from real stock snapshots and submitted count entries.
- Integration monitoring requires the backend and database because it reads persisted import job logs.
- The count flow now supports local queueing for save, delete, and submit actions when the backend is unavailable, using browser storage as the device-side queue foundation.
- `AUTH_DEV_BYPASS=true` remains useful for local development of server-rendered routes until a fuller frontend session/cookie flow is added in a later phase.
