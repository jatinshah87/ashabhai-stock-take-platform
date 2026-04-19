import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcryptjs";
import { AuditLogService } from "src/audit-log/audit-log.service";
import { PrismaService } from "src/prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        role: true,
        warehouseAccesses: true,
        siteAccesses: true,
      },
    });

    if (!user || user.status !== "active") {
      await this.auditLogService.log({
        action: "LOGIN_FAILED",
        entityType: "AUTH",
        metadata: { email: dto.email.toLowerCase(), reason: "user_not_found_or_inactive" },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      await this.auditLogService.log({
        actorUserId: user.id,
        action: "LOGIN_FAILED",
        entityType: "AUTH",
        entityId: user.id,
        metadata: { email: user.email, reason: "password_mismatch" },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.code,
      warehouseIds: user.warehouseAccesses.map((access) => access.warehouseId),
      siteIds: user.siteAccesses.map((access) => access.siteId),
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: this.configService.get<string>("JWT_EXPIRES_IN", "8h") as never,
    });

    await this.auditLogService.log({
      actorUserId: user.id,
      action: "LOGIN",
      entityType: "AUTH",
      entityId: user.id,
      metadata: { email: user.email },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.code,
        warehouseIds: payload.warehouseIds,
        siteIds: payload.siteIds,
      },
    };
  }
}
