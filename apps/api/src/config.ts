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
});

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;

export function validateApiEnvironment(
  environment: Record<string, string | undefined>,
): ApiEnvironment {
  return parseEnvironment(apiEnvironmentSchema, environment);
}
