import { z } from "zod";
import { logLevels, parseEnvironment } from "@makemymarrige/config";

const apiEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z
    .string()
    .min(1)
    .url()
    .refine((value) => /^mongodb(?:\+srv)?:\/\//.test(value), {
      message: "MONGODB_URI must use mongodb:// or mongodb+srv://",
    }),
  LOG_LEVEL: z.enum(logLevels).default("info"),
  AUTH_JWT_ISSUER: z.string().url(),
  AUTH_JWT_AUDIENCE: z.string().min(1).max(200),
  AUTH_JWT_ACTIVE_KID: z.string().min(1).max(100),
  AUTH_JWT_PRIVATE_KEY_PEM: z.string().min(1),
  AUTH_JWT_PUBLIC_KEYS_JSON: z.string().min(1),
  AUTH_ALLOWED_ORIGINS: z.string().min(1),
});

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;

export function validateApiEnvironment(
  environment: Record<string, string | undefined>,
): ApiEnvironment {
  return parseEnvironment(apiEnvironmentSchema, environment);
}
