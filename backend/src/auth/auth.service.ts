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
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
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
      expiresIn: this.configService.get<string>("JWT_EXPIRES_IN", "8h"),
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
