CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'CONFLICT', 'RESOLVED', 'SKIPPED');
CREATE TYPE "SyncActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SUBMIT');
CREATE TYPE "ConflictType" AS ENUM ('DUPLICATE_LINE', 'PLAN_LOCKED', 'SERVER_STATE_MISMATCH', 'SUBMISSION_CONFLICT', 'OUT_OF_SCOPE', 'INVALID_REFERENCE');
CREATE TYPE "ConflictStatus" AS ENUM ('OPEN', 'RESOLVED', 'REVIEW_REQUIRED', 'REJECTED');
CREATE TYPE "ConflictResolutionAction" AS ENUM ('KEEP_LOCAL', 'KEEP_SERVER', 'MARK_REVIEW', 'RETRY_REPLAY', 'REJECTED');

CREATE TABLE "SyncQueue" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "countType" "CountType" NOT NULL,
  "warehouseId" TEXT,
  "siteId" TEXT,
  "locationId" TEXT,
  "itemId" TEXT,
  "itemUomId" TEXT,
  "uomCode" TEXT,
  "countedQuantity" DECIMAL(18,4),
  "actionType" "SyncActionType" NOT NULL,
  "clientEntryId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "clientTimestamp" TIMESTAMP(3) NOT NULL,
  "serverProcessedAt" TIMESTAMP(3),
  "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT,
  "userId" TEXT NOT NULL,
  "payloadSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SyncQueue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SyncConflict" (
  "id" TEXT NOT NULL,
  "syncQueueId" TEXT,
  "planId" TEXT NOT NULL,
  "countType" "CountType" NOT NULL,
  "locationId" TEXT,
  "itemId" TEXT,
  "itemUomId" TEXT,
  "uomCode" TEXT,
  "localValue" JSONB NOT NULL,
  "serverValue" JSONB,
  "conflictType" "ConflictType" NOT NULL,
  "status" "ConflictStatus" NOT NULL DEFAULT 'OPEN',
  "resolutionAction" "ConflictResolutionAction",
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SyncConflict_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SyncQueue_deviceId_clientEntryId_actionType_key"
ON "SyncQueue"("deviceId", "clientEntryId", "actionType");

CREATE INDEX "SyncQueue_userId_syncStatus_idx" ON "SyncQueue"("userId", "syncStatus");
CREATE INDEX "SyncQueue_planId_countType_actionType_idx" ON "SyncQueue"("planId", "countType", "actionType");
CREATE INDEX "SyncConflict_status_conflictType_idx" ON "SyncConflict"("status", "conflictType");
CREATE INDEX "SyncConflict_planId_countType_idx" ON "SyncConflict"("planId", "countType");

ALTER TABLE "SyncQueue"
ADD CONSTRAINT "SyncQueue_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "StockTakePlan"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SyncQueue"
ADD CONSTRAINT "SyncQueue_warehouseId_fkey"
FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SyncQueue"
ADD CONSTRAINT "SyncQueue_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SyncQueue"
ADD CONSTRAINT "SyncQueue_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "Location"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SyncQueue"
ADD CONSTRAINT "SyncQueue_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SyncQueue"
ADD CONSTRAINT "SyncQueue_itemUomId_fkey"
FOREIGN KEY ("itemUomId") REFERENCES "ItemUOM"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SyncQueue"
ADD CONSTRAINT "SyncQueue_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SyncConflict"
ADD CONSTRAINT "SyncConflict_syncQueueId_fkey"
FOREIGN KEY ("syncQueueId") REFERENCES "SyncQueue"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SyncConflict"
ADD CONSTRAINT "SyncConflict_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "StockTakePlan"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SyncConflict"
ADD CONSTRAINT "SyncConflict_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "Location"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SyncConflict"
ADD CONSTRAINT "SyncConflict_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SyncConflict"
ADD CONSTRAINT "SyncConflict_itemUomId_fkey"
FOREIGN KEY ("itemUomId") REFERENCES "ItemUOM"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SyncConflict"
ADD CONSTRAINT "SyncConflict_resolvedById_fkey"
FOREIGN KEY ("resolvedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
