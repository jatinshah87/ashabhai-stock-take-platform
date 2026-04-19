import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ROLE_CODES } from "src/common/constants/role-codes";
import { CurrentUser, CurrentUserPayload } from "src/common/decorators/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { InterpretQuantityDto } from "./dto/interpret-quantity.dto";
import { VoiceCountingEventDto } from "./dto/voice-counting-event.dto";
import { VoiceService } from "./voice.service";

@Controller("voice")
@UseGuards(JwtOrDevAuthGuard, RolesGuard)
@Roles(
  ROLE_CODES.SYSTEM_ADMIN,
  ROLE_CODES.AUDITOR,
  ROLE_CODES.WAREHOUSE_USER,
  ROLE_CODES.MANAGEMENT,
)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Get("config")
  getConfig() {
    return this.voiceService.getConfig();
  }

  @Post("interpret-quantity")
  interpretQuantity(@Body() dto: InterpretQuantityDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.voiceService.interpretQuantity(dto, user);
  }

  @Post("counting-event")
  logEvent(@Body() dto: VoiceCountingEventDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.voiceService.logCountingEvent(dto, user);
  }
}
