import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUser, CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { QueryImportJobsDto } from "./dto/import-common.dto";
import { ImportItemBarcodesDto } from "./dto/import-item-barcode.dto";
import { ImportItemsDto } from "./dto/import-item.dto";
import { ImportItemUomsDto } from "./dto/import-item-uom.dto";
import { ImportLocationsDto } from "./dto/import-location.dto";
import { ImportSitesDto } from "./dto/import-site.dto";
import { ImportStockSnapshotsDto } from "./dto/import-stock-snapshot.dto";
import { ImportWarehousesDto } from "./dto/import-warehouse.dto";
import { IntegrationService } from "./integration.service";

@Controller("integration")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
@Roles(ROLE_CODES.SYSTEM_ADMIN)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get("jobs")
  listJobs(@Query() query: QueryImportJobsDto) {
    return this.integrationService.listJobs(query);
  }

  @Get("jobs/:id")
  getJob(@Param("id") id: string) {
    return this.integrationService.getJob(id);
  }

  @Post("warehouses/import")
  importWarehouses(@Body() dto: ImportWarehousesDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.integrationService.importWarehouses(dto, user);
  }

  @Post("sites/import")
  importSites(@Body() dto: ImportSitesDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.integrationService.importSites(dto, user);
  }

  @Post("locations/import")
  importLocations(@Body() dto: ImportLocationsDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.integrationService.importLocations(dto, user);
  }

  @Post("items/import")
  importItems(@Body() dto: ImportItemsDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.integrationService.importItems(dto, user);
  }

  @Post("item-barcodes/import")
  importItemBarcodes(@Body() dto: ImportItemBarcodesDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.integrationService.importItemBarcodes(dto, user);
  }

  @Post("item-uoms/import")
  importItemUoms(@Body() dto: ImportItemUomsDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.integrationService.importItemUoms(dto, user);
  }

  @Post("stock-snapshots/import")
  importStockSnapshots(
    @Body() dto: ImportStockSnapshotsDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.integrationService.importStockSnapshots(dto, user);
  }
}
