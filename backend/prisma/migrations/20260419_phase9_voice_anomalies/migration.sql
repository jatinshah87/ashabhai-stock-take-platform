CREATE TYPE "AnomalyType" AS ENUM (
  'HIGH_VARIANCE',
  'EXTREME_MISMATCH',
  'FIRST_SECOND_MISMATCH',
  'UOM_CONSISTENCY',
  'REPEATED_USER_VARIANCE',
  'RAPID_COUNTING',
  'REPEATED_SYNC_CONFLICT',
  'DATA_FRESHNESS'
);

CREATE TYPE "AnomalySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "AnomalyStatus" AS ENUM ('OPEN', 'REVIEWED', 'CLOSED');

CREATE TABLE "Anomaly" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "anomalyType" "AnomalyType" NOT NULL,
  "severity" "AnomalySeverity" NOT NULL,
  "status" "AnomalyStatus" NOT NULL DEFAULT 'OPEN',
  "planId" TEXT,
  "warehouseId" TEXT,
  "siteId" TEXT,
  "locationId" TEXT,
  "itemId" TEXT,
  "userId" TEXT,
  "relatedCountEntryId" TEXT,
  "summary" TEXT NOT NULL,
  "details" JSONB,
  "notes" TEXT,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Anomaly_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Anomaly_fingerprint_key" ON "Anomaly"("fingerprint");
CREATE INDEX "Anomaly_status_severity_idx" ON "Anomaly"("status", "severity");
CREATE INDEX "Anomaly_anomalyType_detectedAt_idx" ON "Anomaly"("anomalyType", "detectedAt");
CREATE INDEX "Anomaly_planId_warehouseId_siteId_idx" ON "Anomaly"("planId", "warehouseId", "siteId");

ALTER TABLE "Anomaly"
ADD CONSTRAINT "Anomaly_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StockTakePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Anomaly"
ADD CONSTRAINT "Anomaly_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Anomaly"
ADD CONSTRAINT "Anomaly_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Anomaly"
ADD CONSTRAINT "Anomaly_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Anomaly"
ADD CONSTRAINT "Anomaly_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Anomaly"
ADD CONSTRAINT "Anomaly_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Anomaly"
ADD CONSTRAINT "Anomaly_relatedCountEntryId_fkey" FOREIGN KEY ("relatedCountEntryId") REFERENCES "CountEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Anomaly"
ADD CONSTRAINT "Anomaly_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
