import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser, CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { MasterDataService } from "./master-data.service";

@Controller("master-data")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get("warehouses")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  listWarehouses(@CurrentUser() user?: CurrentUserPayload) {
    return this.masterDataService.listWarehouses(user);
  }

  @Get("warehouses/:warehouseId/sites")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  listSitesByWarehouse(
    @Param("warehouseId") warehouseId: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.masterDataService.listSitesByWarehouse(warehouseId, user);
  }

  @Get("sites/:siteId/locations")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  listLocationsBySite(@Param("siteId") siteId: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.masterDataService.listLocationsBySite(siteId, user);
  }

  @Get("hierarchy")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  hierarchy(@CurrentUser() user?: CurrentUserPayload) {
    return this.masterDataService.listHierarchy(user);
  }
}
