export const ROLE_CODES = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  AUDITOR: "AUDITOR",
  WAREHOUSE_USER: "WAREHOUSE_USER",
  MANAGEMENT: "MANAGEMENT",
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
