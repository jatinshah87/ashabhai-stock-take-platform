import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.syncConflict.deleteMany();
  await prisma.syncQueue.deleteMany();
  await prisma.importJobDetail.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.countEntry.deleteMany();
  await prisma.countSubmission.deleteMany();
  await prisma.stockSnapshot.deleteMany();
  await prisma.itemBarcode.deleteMany();
  await prisma.itemUOM.deleteMany();
  await prisma.item.deleteMany();
  await prisma.stockTakePlanLocation.deleteMany();
  await prisma.stockTakePlanSite.deleteMany();
  await prisma.stockTakePlan.deleteMany();
  await prisma.userSiteAccess.deleteMany();
  await prisma.userWarehouseAccess.deleteMany();
  await prisma.location.deleteMany();
  await prisma.site.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  const [adminRole, auditorRole, warehouseRole] = await Promise.all([
    prisma.role.create({ data: { code: "SYSTEM_ADMIN", name: "System Admin" } }),
    prisma.role.create({ data: { code: "AUDITOR", name: "Auditor" } }),
    prisma.role.create({ data: { code: "WAREHOUSE_USER", name: "Warehouse User" } }),
  ]);

  const passwordHash = await hash(process.env.DEFAULT_USER_PASSWORD ?? "ChangeMe@123", 10);

  const [ahd, srt, rjt] = await Promise.all([
    prisma.warehouse.create({
      data: {
        code: "AHD-DC",
        name: "Ahmedabad Distribution Center",
        city: "Ahmedabad",
        region: "Gujarat Central",
        status: "active",
      },
    }),
    prisma.warehouse.create({
      data: {
        code: "SRT-DC",
        name: "Surat Distribution Center",
        city: "Surat",
        region: "South Gujarat",
        status: "active",
      },
    }),
    prisma.warehouse.create({
      data: {
        code: "RJT-SW",
        name: "Rajkot Satellite Warehouse",
        city: "Rajkot",
        region: "Saurashtra",
        status: "active",
      },
    }),
  ]);

  const [siteA1, siteD3, siteFrz, siteB1, siteC2, siteA2, siteR1] = await Promise.all([
    prisma.site.create({
      data: {
        warehouseId: ahd.id,
        code: "A1",
        name: "Aisle A Storage",
        type: "Primary Storage",
        manager: "Jignesh Parmar",
        status: "active",
      },
    }),
    prisma.site.create({
      data: {
        warehouseId: ahd.id,
        code: "D3",
        name: "Dispatch Rack D3",
        type: "Dispatch",
        manager: "Krunal Soni",
        status: "active",
      },
    }),
    prisma.site.create({
      data: {
        warehouseId: ahd.id,
        code: "FRZ",
        name: "Frozen Bay",
        type: "Cold Chain",
        manager: "Priya Chauhan",
        status: "active",
      },
    }),
    prisma.site.create({
      data: {
        warehouseId: srt.id,
        code: "B1",
        name: "Bulk Pallet Zone",
        type: "Bulk",
        manager: "Meera Shah",
        status: "active",
      },
    }),
    prisma.site.create({
      data: {
        warehouseId: srt.id,
        code: "C2",
        name: "Cosmetics Rack C2",
        type: "High Value",
        manager: "Nirali Dave",
        status: "active",
      },
    }),
    prisma.site.create({
      data: {
        warehouseId: rjt.id,
        code: "A2",
        name: "Main Picking A2",
        type: "Picking",
        manager: "Rina Desai",
        status: "active",
      },
    }),
    prisma.site.create({
      data: {
        warehouseId: rjt.id,
        code: "R1",
        name: "Reserve Rack R1",
        type: "Reserve Storage",
        manager: "Rina Desai",
        status: "active",
      },
    }),
  ]);

  const locations = await Promise.all([
    prisma.location.create({
      data: {
        warehouseId: ahd.id,
        siteId: siteA1.id,
        code: "A1-01",
        name: "Aisle A1 Bay 01",
        aisle: "A1",
        zone: "Storage",
        barcode: "LOC-A1-01",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: ahd.id,
        siteId: siteA1.id,
        code: "A1-02",
        name: "Aisle A1 Bay 02",
        aisle: "A1",
        zone: "Storage",
        barcode: "LOC-A1-02",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: ahd.id,
        siteId: siteA1.id,
        code: "A1-04",
        name: "Aisle A1 Bay 04",
        aisle: "A1",
        zone: "Storage",
        barcode: "LOC-A1-04",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: ahd.id,
        siteId: siteD3.id,
        code: "D3-01",
        name: "Dispatch D3 Rack 01",
        aisle: "D3",
        zone: "Dispatch",
        barcode: "LOC-D3-01",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: ahd.id,
        siteId: siteD3.id,
        code: "D3-02",
        name: "Dispatch D3 Rack 02",
        aisle: "D3",
        zone: "Dispatch",
        barcode: "LOC-D3-02",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: ahd.id,
        siteId: siteFrz.id,
        code: "FRZ-01",
        name: "Frozen Bay 01",
        aisle: "FRZ",
        zone: "Cold Chain",
        barcode: "LOC-FRZ-01",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: ahd.id,
        siteId: siteFrz.id,
        code: "FRZ-02",
        name: "Frozen Bay 02",
        aisle: "FRZ",
        zone: "Cold Chain",
        barcode: "LOC-FRZ-02",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: srt.id,
        siteId: siteB1.id,
        code: "B1-01",
        name: "Bulk B1 Pallet 01",
        aisle: "B1",
        zone: "Bulk",
        barcode: "LOC-B1-01",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: srt.id,
        siteId: siteB1.id,
        code: "B1-02",
        name: "Bulk B1 Pallet 02",
        aisle: "B1",
        zone: "Bulk",
        barcode: "LOC-B1-02",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: srt.id,
        siteId: siteC2.id,
        code: "C2-01",
        name: "Cosmetics C2 Shelf 01",
        aisle: "C2",
        zone: "High Value",
        barcode: "LOC-C2-01",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: srt.id,
        siteId: siteC2.id,
        code: "C2-03",
        name: "Cosmetics C2 Shelf 03",
        aisle: "C2",
        zone: "High Value",
        barcode: "LOC-C2-03",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: rjt.id,
        siteId: siteA2.id,
        code: "A2-01",
        name: "Picking A2 Bay 01",
        aisle: "A2",
        zone: "Picking",
        barcode: "LOC-A2-01",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: rjt.id,
        siteId: siteA2.id,
        code: "A2-02",
        name: "Picking A2 Bay 02",
        aisle: "A2",
        zone: "Picking",
        barcode: "LOC-A2-02",
        status: "active",
      },
    }),
    prisma.location.create({
      data: {
        warehouseId: rjt.id,
        siteId: siteR1.id,
        code: "R1-01",
        name: "Reserve R1 Bin 01",
        aisle: "R1",
        zone: "Reserve",
        barcode: "LOC-R1-01",
        status: "active",
      },
    }),
  ]);

  const locationMap = new Map(locations.map((location) => [location.code, location]));

  const userData = [
    {
      employeeCode: "EMP-1001",
      name: "Harshil Patel",
      email: "harshil.patel@ashabhai.co",
      phone: "+91 98765 41001",
      roleId: adminRole.id,
      status: "active",
      warehouseIds: [ahd.id],
      siteIds: [siteA1.id, siteD3.id],
    },
    {
      employeeCode: "EMP-2014",
      name: "Meera Shah",
      email: "meera.shah@ashabhai.co",
      phone: "+91 98765 41014",
      roleId: auditorRole.id,
      status: "active",
      warehouseIds: [srt.id, ahd.id],
      siteIds: [siteB1.id, siteC2.id, siteA1.id],
    },
    {
      employeeCode: "EMP-3048",
      name: "Jignesh Parmar",
      email: "jignesh.parmar@ashabhai.co",
      phone: "+91 98765 43048",
      roleId: warehouseRole.id,
      status: "active",
      warehouseIds: [ahd.id],
      siteIds: [siteA1.id, siteD3.id],
    },
    {
      employeeCode: "EMP-3052",
      name: "Krunal Soni",
      email: "krunal.soni@ashabhai.co",
      phone: "+91 98765 43052",
      roleId: warehouseRole.id,
      status: "inactive",
      warehouseIds: [ahd.id],
      siteIds: [siteD3.id, siteFrz.id],
    },
    {
      employeeCode: "EMP-2021",
      name: "Rina Desai",
      email: "rina.desai@ashabhai.co",
      phone: "+91 98765 42021",
      roleId: auditorRole.id,
      status: "active",
      warehouseIds: [rjt.id],
      siteIds: [siteA2.id, siteR1.id],
    },
    {
      employeeCode: "EMP-3059",
      name: "Priya Chauhan",
      email: "priya.chauhan@ashabhai.co",
      phone: "+91 98765 43059",
      roleId: warehouseRole.id,
      status: "active",
      warehouseIds: [ahd.id],
      siteIds: [siteFrz.id],
    },
    {
      employeeCode: "EMP-3064",
      name: "Nirali Dave",
      email: "nirali.dave@ashabhai.co",
      phone: "+91 98765 43064",
      roleId: warehouseRole.id,
      status: "active",
      warehouseIds: [srt.id],
      siteIds: [siteB1.id, siteC2.id],
    },
  ] as const;

  const createdUsers = [];
  for (const item of userData) {
    const user = await prisma.user.create({
      data: {
        employeeCode: item.employeeCode,
        name: item.name,
        email: item.email,
        phone: item.phone,
        passwordHash,
        roleId: item.roleId,
        status: item.status,
        warehouseAccesses: {
          create: item.warehouseIds.map((warehouseId) => ({ warehouseId })),
        },
        siteAccesses: {
          create: item.siteIds.map((siteId) => ({ siteId })),
        },
      },
    });
    createdUsers.push(user);
  }

  const userMap = new Map(createdUsers.map((user) => [user.email, user]));

  const items = await Promise.all([
    prisma.item.create({
      data: {
        code: "ITM-10001",
        description: "Ashabhai Premium Tea 500g",
        status: "active",
        barcodes: {
          create: [
            { barcode: "ITEM-TEA-500G", uomCode: "PCS", isPrimary: true },
            { barcode: "ITEM-TEA-500G-CS12", uomCode: "CASE12", isPrimary: false },
          ],
        },
        uoms: {
          create: [
            { uomCode: "PCS", conversionFactor: "1", isBase: true },
            { uomCode: "CASE12", conversionFactor: "12", isBase: false },
          ],
        },
      },
      include: { uoms: true },
    }),
    prisma.item.create({
      data: {
        code: "ITM-10022",
        description: "Instant Coffee Jar 200g",
        status: "active",
        barcodes: {
          create: [
            { barcode: "ITEM-COF-200G", uomCode: "PCS", isPrimary: true },
            { barcode: "ITEM-COF-200G-CS24", uomCode: "CASE24", isPrimary: false },
          ],
        },
        uoms: {
          create: [
            { uomCode: "PCS", conversionFactor: "1", isBase: true },
            { uomCode: "CASE24", conversionFactor: "24", isBase: false },
          ],
        },
      },
      include: { uoms: true },
    }),
    prisma.item.create({
      data: {
        code: "ITM-20007",
        description: "Frozen Mixed Vegetables 1kg",
        status: "active",
        barcodes: {
          create: [
            { barcode: "ITEM-FRZ-1KG", uomCode: "BAG", isPrimary: true },
            { barcode: "ITEM-FRZ-1KG-CS10", uomCode: "CASE10", isPrimary: false },
          ],
        },
        uoms: {
          create: [
            { uomCode: "BAG", conversionFactor: "1", isBase: true },
            { uomCode: "CASE10", conversionFactor: "10", isBase: false },
          ],
        },
      },
      include: { uoms: true },
    }),
    prisma.item.create({
      data: {
        code: "ITM-30031",
        description: "Luxury Skin Cream 50ml",
        status: "active",
        barcodes: {
          create: [
            { barcode: "ITEM-SKIN-50ML", uomCode: "PCS", isPrimary: true },
            { barcode: "ITEM-SKIN-50ML-IN6", uomCode: "INNER6", isPrimary: false },
          ],
        },
        uoms: {
          create: [
            { uomCode: "PCS", conversionFactor: "1", isBase: true },
            { uomCode: "INNER6", conversionFactor: "6", isBase: false },
          ],
        },
      },
      include: { uoms: true },
    }),
  ]);

  const itemMap = new Map(items.map((item) => [item.code, item]));
  const itemUomByKey = new Map(
    items.flatMap((item) => item.uoms.map((uom) => [`${item.code}:${uom.uomCode}`, uom] as const)),
  );

  const stockSnapshotSeed = [
    ["A1-01", "ITM-10001", "PCS", "144"],
    ["A1-01", "ITM-10022", "CASE24", "8"],
    ["A1-02", "ITM-10001", "CASE12", "10"],
    ["A1-02", "ITM-30031", "PCS", "42"],
    ["D3-01", "ITM-10022", "PCS", "63"],
    ["D3-02", "ITM-10001", "PCS", "91"],
    ["FRZ-01", "ITM-20007", "CASE10", "12"],
    ["FRZ-02", "ITM-20007", "BAG", "37"],
    ["B1-01", "ITM-10022", "CASE24", "9"],
    ["B1-02", "ITM-10001", "CASE12", "7"],
    ["C2-01", "ITM-30031", "INNER6", "11"],
    ["C2-03", "ITM-30031", "PCS", "28"],
    ["A2-01", "ITM-10001", "PCS", "56"],
    ["A2-02", "ITM-10022", "PCS", "44"],
    ["R1-01", "ITM-30031", "INNER6", "6"],
  ] as const;

  for (const [locationCode, itemCode, uomCode, quantity] of stockSnapshotSeed) {
    const location = locationMap.get(locationCode)!;
    await prisma.stockSnapshot.create({
      data: {
        warehouseId: location.warehouseId,
        siteId: location.siteId,
        locationId: location.id,
        itemId: itemMap.get(itemCode)!.id,
        itemUomId: itemUomByKey.get(`${itemCode}:${uomCode}`)!.id,
        quantity,
        snapshotAt: new Date("2026-04-18T05:30:00.000Z"),
      },
    });
  }

  const planAhd = await prisma.stockTakePlan.create({
    data: {
      code: "FY26-AHD-ANNUAL",
      name: "FY26 Ahmedabad Annual Stock Take",
      description: "Annual blind count covering primary storage, dispatch and frozen inventory.",
      warehouseId: ahd.id,
      scheduledDate: new Date("2026-04-18T00:00:00.000Z"),
      scheduleWindow: "14:00 - 22:00",
      firstCountUserId: userMap.get("jignesh.parmar@ashabhai.co")!.id,
      secondCountUserId: userMap.get("meera.shah@ashabhai.co")!.id,
      notes: "Blind count enabled. Route mixed pallets and damaged stock for supervisor review.",
      instructions: "Scan location first, then item. Use exception path for mixed pallets and damaged units.",
      countMethod: "Blind Count",
      locked: false,
      highVariancePlaceholder: true,
      status: "In Progress",
      sites: {
        create: [siteA1.id, siteD3.id, siteFrz.id].map((siteId) => ({ siteId })),
      },
      locations: {
        create: ["A1-01", "A1-02", "A1-04", "D3-01", "D3-02", "FRZ-01"].map((code) => ({
          locationId: locationMap.get(code)!.id,
        })),
      },
      countSubmissions: {
        create: [{ countType: "FIRST" }, { countType: "SECOND" }],
      },
    },
  });

  const planSrt = await prisma.stockTakePlan.create({
    data: {
      code: "APR26-SRT-CYCLE",
      name: "April Surat Cycle Count",
      description: "Cycle count for bulk and cosmetics sections ahead of month-close reconciliation.",
      warehouseId: srt.id,
      scheduledDate: new Date("2026-04-21T00:00:00.000Z"),
      scheduleWindow: "09:30 - 16:30",
      firstCountUserId: userMap.get("nirali.dave@ashabhai.co")!.id,
      secondCountUserId: userMap.get("meera.shah@ashabhai.co")!.id,
      notes: "Focus on high-value and bulk pallet exceptions before month close.",
      instructions: "Verify seal condition for cosmetics and isolate blocked stock before final save.",
      countMethod: "Cycle Count",
      locked: false,
      highVariancePlaceholder: false,
      status: "Scheduled",
      sites: {
        create: [siteB1.id, siteC2.id].map((siteId) => ({ siteId })),
      },
      locations: {
        create: ["B1-01", "B1-02", "C2-01", "C2-03"].map((code) => ({
          locationId: locationMap.get(code)!.id,
        })),
      },
      countSubmissions: {
        create: [{ countType: "FIRST" }, { countType: "SECOND" }],
      },
    },
  });

  const planRjt = await prisma.stockTakePlan.create({
    data: {
      code: "APR26-RJT-SAMPLE",
      name: "Rajkot Audit Sample Count",
      description: "Audit-led sample count of picking and reserve storage for process assurance.",
      warehouseId: rjt.id,
      scheduledDate: new Date("2026-04-19T00:00:00.000Z"),
      scheduleWindow: "11:00 - 18:00",
      firstCountUserId: userMap.get("rina.desai@ashabhai.co")!.id,
      secondCountUserId: userMap.get("jignesh.parmar@ashabhai.co")!.id,
      notes: "Sample count for process assurance and audit validation.",
      instructions: "Supervise reserve stock access and maintain second-count segregation.",
      countMethod: "Frozen Count",
      locked: false,
      highVariancePlaceholder: true,
      status: "In Progress",
      sites: {
        create: [siteA2.id, siteR1.id].map((siteId) => ({ siteId })),
      },
      locations: {
        create: ["A2-01", "A2-02", "R1-01"].map((code) => ({
          locationId: locationMap.get(code)!.id,
        })),
      },
      countSubmissions: {
        create: [
          {
            countType: "FIRST",
            status: "SUBMITTED",
            submittedByUserId: userMap.get("rina.desai@ashabhai.co")!.id,
            submittedAt: new Date("2026-04-19T10:45:00.000Z"),
            notes: "First count completed and sealed for second count.",
          },
          { countType: "SECOND" },
        ],
      },
    },
  });

  const planCompleted = await prisma.stockTakePlan.create({
    data: {
      code: "APR26-SRT-CLOSED",
      name: "Surat Closed Verification Count",
      description: "Completed historical plan retained for read-only submission validation.",
      warehouseId: srt.id,
      scheduledDate: new Date("2026-04-10T00:00:00.000Z"),
      scheduleWindow: "08:00 - 12:00",
      firstCountUserId: userMap.get("nirali.dave@ashabhai.co")!.id,
      secondCountUserId: userMap.get("meera.shah@ashabhai.co")!.id,
      notes: "Historical closed count for submission lock testing.",
      instructions: "Closed plan retained for review-only route checks.",
      countMethod: "Cycle Count",
      locked: true,
      highVariancePlaceholder: false,
      status: "Completed",
      sites: {
        create: [siteC2.id].map((siteId) => ({ siteId })),
      },
      locations: {
        create: ["C2-01"].map((code) => ({
          locationId: locationMap.get(code)!.id,
        })),
      },
      countSubmissions: {
        create: [
          {
            countType: "FIRST",
            status: "SUBMITTED",
            submittedByUserId: userMap.get("nirali.dave@ashabhai.co")!.id,
            submittedAt: new Date("2026-04-10T06:00:00.000Z"),
            notes: "Submitted.",
          },
          {
            countType: "SECOND",
            status: "SUBMITTED",
            submittedByUserId: userMap.get("meera.shah@ashabhai.co")!.id,
            submittedAt: new Date("2026-04-10T07:15:00.000Z"),
            notes: "Reconciled and closed.",
          },
        ],
      },
    },
  });

  await prisma.countEntry.createMany({
    data: [
      {
        planId: planAhd.id,
        countType: "FIRST",
        warehouseId: ahd.id,
        siteId: siteA1.id,
        locationId: locationMap.get("A1-01")!.id,
        itemId: itemMap.get("ITM-10001")!.id,
        itemUomId: itemUomByKey.get("ITM-10001:PCS")!.id,
        countedQty: "140",
        countedByUserId: userMap.get("jignesh.parmar@ashabhai.co")!.id,
        countedAt: new Date("2026-04-18T08:15:00.000Z"),
      },
      {
        planId: planAhd.id,
        countType: "FIRST",
        warehouseId: ahd.id,
        siteId: siteA1.id,
        locationId: locationMap.get("A1-02")!.id,
        itemId: itemMap.get("ITM-30031")!.id,
        itemUomId: itemUomByKey.get("ITM-30031:PCS")!.id,
        countedQty: "40",
        countedByUserId: userMap.get("jignesh.parmar@ashabhai.co")!.id,
        countedAt: new Date("2026-04-18T08:32:00.000Z"),
      },
      {
        planId: planRjt.id,
        countType: "FIRST",
        warehouseId: rjt.id,
        siteId: siteA2.id,
        locationId: locationMap.get("A2-01")!.id,
        itemId: itemMap.get("ITM-10001")!.id,
        itemUomId: itemUomByKey.get("ITM-10001:PCS")!.id,
        countedQty: "55",
        countedByUserId: userMap.get("rina.desai@ashabhai.co")!.id,
        countedAt: new Date("2026-04-19T09:10:00.000Z"),
      },
      {
        planId: planRjt.id,
        countType: "FIRST",
        warehouseId: rjt.id,
        siteId: siteR1.id,
        locationId: locationMap.get("R1-01")!.id,
        itemId: itemMap.get("ITM-30031")!.id,
        itemUomId: itemUomByKey.get("ITM-30031:INNER6")!.id,
        countedQty: "6",
        countedByUserId: userMap.get("rina.desai@ashabhai.co")!.id,
        countedAt: new Date("2026-04-19T09:48:00.000Z"),
      },
      {
        planId: planCompleted.id,
        countType: "FIRST",
        warehouseId: srt.id,
        siteId: siteC2.id,
        locationId: locationMap.get("C2-01")!.id,
        itemId: itemMap.get("ITM-30031")!.id,
        itemUomId: itemUomByKey.get("ITM-30031:INNER6")!.id,
        countedQty: "11",
        countedByUserId: userMap.get("nirali.dave@ashabhai.co")!.id,
        countedAt: new Date("2026-04-10T05:20:00.000Z"),
      },
      {
        planId: planCompleted.id,
        countType: "SECOND",
        warehouseId: srt.id,
        siteId: siteC2.id,
        locationId: locationMap.get("C2-01")!.id,
        itemId: itemMap.get("ITM-30031")!.id,
        itemUomId: itemUomByKey.get("ITM-30031:INNER6")!.id,
        countedQty: "11",
        countedByUserId: userMap.get("meera.shah@ashabhai.co")!.id,
        countedAt: new Date("2026-04-10T06:40:00.000Z"),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
