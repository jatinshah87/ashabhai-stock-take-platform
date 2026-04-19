CREATE TYPE "CountType" AS ENUM ('FIRST', 'SECOND');
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED');

CREATE TABLE "Item" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItemBarcode" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "barcode" TEXT NOT NULL,
  "uomCode" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItemBarcode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItemUOM" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "uomCode" TEXT NOT NULL,
  "conversionFactor" DECIMAL(18,4) NOT NULL,
  "isBase" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItemUOM_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockSnapshot" (
  "id" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "itemUomId" TEXT NOT NULL,
  "quantity" DECIMAL(18,4) NOT NULL,
  "snapshotAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StockSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CountEntry" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "countType" "CountType" NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "itemUomId" TEXT NOT NULL,
  "countedQty" DECIMAL(18,4) NOT NULL,
  "countedByUserId" TEXT NOT NULL,
  "countedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CountEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CountSubmission" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "countType" "CountType" NOT NULL,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedByUserId" TEXT,
  "submittedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CountSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Item_code_key" ON "Item"("code");
CREATE UNIQUE INDEX "ItemBarcode_barcode_key" ON "ItemBarcode"("barcode");
CREATE UNIQUE INDEX "ItemUOM_itemId_uomCode_key" ON "ItemUOM"("itemId", "uomCode");
CREATE INDEX "StockSnapshot_warehouseId_siteId_locationId_idx" ON "StockSnapshot"("warehouseId", "siteId", "locationId");
CREATE INDEX "StockSnapshot_itemId_snapshotAt_idx" ON "StockSnapshot"("itemId", "snapshotAt");
CREATE UNIQUE INDEX "CountEntry_planId_countType_locationId_itemId_key" ON "CountEntry"("planId", "countType", "locationId", "itemId");
CREATE INDEX "CountEntry_planId_countType_idx" ON "CountEntry"("planId", "countType");
CREATE UNIQUE INDEX "CountSubmission_planId_countType_key" ON "CountSubmission"("planId", "countType");

ALTER TABLE "ItemBarcode"
ADD CONSTRAINT "ItemBarcode_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ItemUOM"
ADD CONSTRAINT "ItemUOM_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockSnapshot"
ADD CONSTRAINT "StockSnapshot_warehouseId_fkey"
FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockSnapshot"
ADD CONSTRAINT "StockSnapshot_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockSnapshot"
ADD CONSTRAINT "StockSnapshot_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockSnapshot"
ADD CONSTRAINT "StockSnapshot_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockSnapshot"
ADD CONSTRAINT "StockSnapshot_itemUomId_fkey"
FOREIGN KEY ("itemUomId") REFERENCES "ItemUOM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountEntry"
ADD CONSTRAINT "CountEntry_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "StockTakePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountEntry"
ADD CONSTRAINT "CountEntry_warehouseId_fkey"
FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountEntry"
ADD CONSTRAINT "CountEntry_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountEntry"
ADD CONSTRAINT "CountEntry_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountEntry"
ADD CONSTRAINT "CountEntry_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountEntry"
ADD CONSTRAINT "CountEntry_itemUomId_fkey"
FOREIGN KEY ("itemUomId") REFERENCES "ItemUOM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountEntry"
ADD CONSTRAINT "CountEntry_countedByUserId_fkey"
FOREIGN KEY ("countedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountSubmission"
ADD CONSTRAINT "CountSubmission_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "StockTakePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CountSubmission"
ADD CONSTRAINT "CountSubmission_submittedByUserId_fkey"
FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
