import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { LoginRateLimitGuard } from "src/common/guards/rate-limit.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @UseGuards(LoginRateLimitGuard)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
