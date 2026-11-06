import { z } from "zod";

export function parseEnvironment<T extends z.ZodType>(
  schema: T,
  environment: Record<string, string | undefined>,
): z.infer<T> {
  return schema.parse(environment);
}

export const logLevels = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;
