import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { ROLE_CODES } from "../constants/role-codes";

@Injectable()
export class JwtOrDevAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      try {
        request.user = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>("JWT_SECRET"),
        });
        return true;
      } catch {
        throw new UnauthorizedException("Invalid or expired token");
      }
    }

    const devBypass = this.configService.get<string>("AUTH_DEV_BYPASS") === "true";
    if (!devBypass) {
      throw new UnauthorizedException("Authentication token is required");
    }

    const adminUser = await this.prisma.user.findFirst({
      where: {
        role: {
          code: ROLE_CODES.SYSTEM_ADMIN,
        },
      },
      include: {
        role: true,
        warehouseAccesses: true,
        siteAccesses: true,
      },
    });

    if (!adminUser) {
      throw new UnauthorizedException("Development admin user not found");
    }

    request.user = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role.code,
      warehouseIds: adminUser.warehouseAccesses.map((access) => access.warehouseId),
      siteIds: adminUser.siteAccesses.map((access) => access.siteId),
    };

    return true;
  }
}
