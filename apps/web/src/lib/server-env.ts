import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { parseEnvironment } from "@makemymarrige/config";

// Load the repository-level .env in the actual server runtime.
// Supports both root and apps/web working directories.
const envCandidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];

const localEnvFile = envCandidates.find((file) => existsSync(file));

if (localEnvFile) {
  process.loadEnvFile(localEnvFile);
}

const webEnvironmentSchema = z.object({
  API_BASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
      message: "API_BASE_URL must use HTTP or HTTPS.",
    }),
});

export function validateWebEnvironment(
  environment: Record<string, string | undefined>,
): z.infer<typeof webEnvironmentSchema> {
  return parseEnvironment(webEnvironmentSchema, environment);
}

export function getWebEnvironment(): z.infer<typeof webEnvironmentSchema> {
  return validateWebEnvironment(process.env);
}
