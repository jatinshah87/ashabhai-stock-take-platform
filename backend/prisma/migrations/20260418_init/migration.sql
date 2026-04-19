CREATE TABLE "Role" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Warehouse" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

CREATE TABLE "Site" (
  "id" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "manager" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Site_warehouseId_code_key" ON "Site"("warehouseId", "code");

CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "aisle" TEXT NOT NULL,
  "zone" TEXT NOT NULL,
  "barcode" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Location_barcode_key" ON "Location"("barcode");
CREATE UNIQUE INDEX "Location_siteId_code_key" ON "Location"("siteId", "code");

CREATE TABLE "UserWarehouseAccess" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserWarehouseAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserWarehouseAccess_userId_warehouseId_key" ON "UserWarehouseAccess"("userId", "warehouseId");

CREATE TABLE "UserSiteAccess" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSiteAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSiteAccess_userId_siteId_key" ON "UserSiteAccess"("userId", "siteId");

CREATE TABLE "StockTakePlan" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "scheduleWindow" TEXT NOT NULL,
  "firstCountUserId" TEXT NOT NULL,
  "secondCountUserId" TEXT NOT NULL,
  "notes" TEXT NOT NULL,
  "instructions" TEXT NOT NULL,
  "countMethod" TEXT NOT NULL,
  "locked" BOOLEAN NOT NULL DEFAULT false,
  "highVariancePlaceholder" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StockTakePlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StockTakePlan_code_key" ON "StockTakePlan"("code");

CREATE TABLE "StockTakePlanSite" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StockTakePlanSite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StockTakePlanSite_planId_siteId_key" ON "StockTakePlanSite"("planId", "siteId");

CREATE TABLE "StockTakePlanLocation" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StockTakePlanLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StockTakePlanLocation_planId_locationId_key" ON "StockTakePlanLocation"("planId", "locationId");

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Site" ADD CONSTRAINT "Site_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserWarehouseAccess" ADD CONSTRAINT "UserWarehouseAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserWarehouseAccess" ADD CONSTRAINT "UserWarehouseAccess_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSiteAccess" ADD CONSTRAINT "UserSiteAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSiteAccess" ADD CONSTRAINT "UserSiteAccess_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockTakePlan" ADD CONSTRAINT "StockTakePlan_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTakePlan" ADD CONSTRAINT "StockTakePlan_firstCountUserId_fkey" FOREIGN KEY ("firstCountUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTakePlan" ADD CONSTRAINT "StockTakePlan_secondCountUserId_fkey" FOREIGN KEY ("secondCountUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTakePlanSite" ADD CONSTRAINT "StockTakePlanSite_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StockTakePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockTakePlanSite" ADD CONSTRAINT "StockTakePlanSite_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockTakePlanLocation" ADD CONSTRAINT "StockTakePlanLocation_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StockTakePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockTakePlanLocation" ADD CONSTRAINT "StockTakePlanLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
