import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUsersDto } from "./dto/query-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR, ROLE_CODES.WAREHOUSE_USER)
  list(@Query() query: QueryUsersDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.usersService.list(query, user);
  }

  @Get(":id")
  @Roles(ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.AUDITOR)
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(ROLE_CODES.SYSTEM_ADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.usersService.create(dto, user);
  }

  @Patch(":id")
  @Roles(ROLE_CODES.SYSTEM_ADMIN)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Patch(":id/status")
  @Roles(ROLE_CODES.SYSTEM_ADMIN)
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.usersService.updateStatus(id, dto, user);
  }
}
