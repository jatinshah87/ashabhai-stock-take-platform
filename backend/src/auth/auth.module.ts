import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtOrDevAuthGuard } from "src/common/guards/jwt-or-dev-auth.guard";
import { LoginRateLimitGuard } from "src/common/guards/rate-limit.guard";
import { RolesGuard } from "src/common/guards/roles.guard";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtOrDevAuthGuard, RolesGuard, LoginRateLimitGuard],
  exports: [JwtModule, AuthService, JwtOrDevAuthGuard, RolesGuard],
})
export class AuthModule {}
