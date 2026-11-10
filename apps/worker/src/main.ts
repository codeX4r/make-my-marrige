import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { createLogger } from "@makemymarrige/logger";
import { validateWorkerEnvironment } from "./config.js";
import { WorkerModule } from "./worker.module.js";
import { WorkerHealthServer } from "./worker/health-server.js";
import { RedisBullMqBoundary } from "./worker/redis-bullmq.boundary.js";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localEnvFile = resolve(__dirname, "../../../.env");

if (existsSync(localEnvFile)) {
  process.loadEnvFile(localEnvFile);
}

async function bootstrap(): Promise<void> {
  const environment = validateWorkerEnvironment(process.env);
  const app = await NestFactory.createApplicationContext(WorkerModule.register(environment), {
    bufferLogs: true,
  });
  const logger = createLogger("makemymarrige-worker", environment.LOG_LEVEL);
  const healthServer = new WorkerHealthServer(app.get(RedisBullMqBoundary));
  await healthServer.listen(environment.WORKER_HEALTH_PORT);
  const shutdown = async () => {
    await healthServer.close();
    await app.close();
  };
  process.once("SIGTERM", () => void shutdown());
  process.once("SIGINT", () => void shutdown());
  logger.info({ port: environment.WORKER_HEALTH_PORT }, "worker_started");
}

void bootstrap();
