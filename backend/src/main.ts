import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = Number(config.get("PORT", 4000));
  const allowedOrigins = buildAllowedOrigins(config);
  const logger = new Logger("Bootstrap");

  app.setGlobalPrefix("api");
  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`), false);
    },
    credentials: true,
  });
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = request.headers["x-request-id"] ?? randomUUID();
    response.setHeader("x-request-id", requestId);
    next();
  });
  app.use((request: Request, response: Response, next: NextFunction) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    response.setHeader("Permissions-Policy", "microphone=(self)");
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);
  logger.log(`Ashabhai backend listening on http://localhost:${port}/api`);
}

bootstrap();

function buildAllowedOrigins(config: ConfigService) {
  const configuredOrigins = [
    config.get<string>("FRONTEND_URL"),
    config.get<string>("FRONTEND_URLS"),
  ]
    .filter(Boolean)
    .flatMap((value) => value!.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return ["http://localhost:3000"];
}

function isOriginAllowed(origin: string, allowedOrigins: string[]) {
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin.includes("*")) {
      const pattern = allowedOrigin
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      return new RegExp(`^${pattern}$`, "i").test(origin);
    }

    return allowedOrigin.toLowerCase() === origin.toLowerCase();
  });
}
