import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = Number(config.get("PORT", 4000));
  const allowedOrigins = buildAllowedOrigins(config);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin(origin, callback) {
      if (!origin || isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`), false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
  console.log(`Ashabhai backend listening on http://localhost:${port}/api`);
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
