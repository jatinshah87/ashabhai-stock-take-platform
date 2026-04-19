import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUser, CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { QueryItemsDto } from "./dto/query-items.dto";
import { QuerySnapshotsDto } from "./dto/query-snapshots.dto";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("items")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  listItems(@Query() query: QueryItemsDto) {
    return this.inventoryService.listItems(query);
  }

  @Get("barcodes/:barcode")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  getItemByBarcode(@Param("barcode") barcode: string) {
    return this.inventoryService.getItemByBarcode(barcode);
  }

  @Get("items/:itemId/uoms")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  listItemUoms(@Param("itemId") itemId: string) {
    return this.inventoryService.listItemUoms(itemId);
  }

  @Get("stock-snapshots")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  listStockSnapshots(
    @Query() query: QuerySnapshotsDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.inventoryService.listStockSnapshots(query, user);
  }
}
