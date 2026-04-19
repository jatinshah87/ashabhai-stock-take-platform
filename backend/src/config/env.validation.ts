type EnvRecord = Record<string, string | undefined>;

const requiredInAllEnvironments = ["JWT_SECRET", "JWT_EXPIRES_IN"] as const;
const requiredInProduction = ["DATABASE_URL", "FRONTEND_URLS"] as const;

export function validateEnv(config: EnvRecord) {
  const errors: string[] = [];

  for (const key of requiredInAllEnvironments) {
    if (!config[key]?.trim()) {
      errors.push(`${key} is required`);
    }
  }

  const isProduction = (config.NODE_ENV ?? "development").toLowerCase() === "production";

  if (isProduction) {
    for (const key of requiredInProduction) {
      if (!config[key]?.trim()) {
        errors.push(`${key} is required in production`);
      }
    }

    if ((config.AUTH_DEV_BYPASS ?? "").toLowerCase() === "true") {
      errors.push("AUTH_DEV_BYPASS must be false in production");
    }
  }

  if (config.JWT_SECRET && config.JWT_SECRET.length < 16) {
    errors.push("JWT_SECRET must be at least 16 characters long");
  }

  if (config.PORT && Number.isNaN(Number(config.PORT))) {
    errors.push("PORT must be numeric");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.join("; ")}`);
  }

  return config;
}
