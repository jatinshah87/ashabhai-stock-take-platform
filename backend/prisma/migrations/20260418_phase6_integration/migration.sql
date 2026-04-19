CREATE TYPE "ImportJobStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED');
CREATE TYPE "ImportType" AS ENUM ('WAREHOUSE', 'SITE', 'LOCATION', 'ITEM', 'ITEM_BARCODE', 'ITEM_UOM', 'STOCK_SNAPSHOT');
CREATE TYPE "ImportRecordStatus" AS ENUM ('INSERTED', 'UPDATED', 'SKIPPED', 'FAILED');

ALTER TABLE "StockSnapshot"
ADD COLUMN "sourceReference" TEXT;

CREATE TABLE "ImportJob" (
  "id" TEXT NOT NULL,
  "importType" "ImportType" NOT NULL,
  "sourceSystem" TEXT NOT NULL,
  "sourceLabel" TEXT,
  "status" "ImportJobStatus" NOT NULL,
  "totalRecords" INTEGER NOT NULL,
  "insertedCount" INTEGER NOT NULL DEFAULT 0,
  "updatedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "actorUserId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportJobDetail" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "recordIndex" INTEGER NOT NULL,
  "externalKey" TEXT,
  "status" "ImportRecordStatus" NOT NULL,
  "message" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportJobDetail_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImportJob_importType_startedAt_idx" ON "ImportJob"("importType", "startedAt");
CREATE INDEX "ImportJobDetail_importJobId_status_idx" ON "ImportJobDetail"("importJobId", "status");
CREATE UNIQUE INDEX "StockSnapshot_warehouseId_siteId_locationId_itemId_itemUomId_snapshotAt_key"
ON "StockSnapshot"("warehouseId", "siteId", "locationId", "itemId", "itemUomId", "snapshotAt");

ALTER TABLE "ImportJob"
ADD CONSTRAINT "ImportJob_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImportJobDetail"
ADD CONSTRAINT "ImportJobDetail_importJobId_fkey"
FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
