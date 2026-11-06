import { z } from "zod";
import { logLevels, parseEnvironment } from "@makemymarrige/config";

const workerEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  REDIS_URL: z
    .string()
    .min(1)
    .url()
    .refine((value) => /^rediss?:\/\//.test(value), {
      message: "REDIS_URL must use redis:// or rediss://",
    }),
  WORKER_HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(4001),
  LOG_LEVEL: z.enum(logLevels).default("info"),
});

export type WorkerEnvironment = z.infer<typeof workerEnvironmentSchema>;

export function validateWorkerEnvironment(
  environment: Record<string, string | undefined>,
): WorkerEnvironment {
  return parseEnvironment(workerEnvironmentSchema, environment);
}
