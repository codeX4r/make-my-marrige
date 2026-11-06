import "reflect-metadata";
import { ValidationPipe, RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { createLogger } from "@makemymarrige/logger";
import { NestPinoLogger } from "./common/nest-pino.logger.js";
import { validateApiEnvironment } from "./config.js";
import { AppModule } from "./app.module.js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const localEnvFile = resolve(process.cwd(), "../../.env");

if (existsSync(localEnvFile)) {
  process.loadEnvFile(localEnvFile);
}

async function bootstrap(): Promise<void> {
  const environment = validateApiEnvironment(process.env);
  const logger = createLogger("makemymarrige-api", environment.LOG_LEVEL);
  const app = await NestFactory.create(AppModule.register(environment), { bufferLogs: true });

  app.useLogger(new NestPinoLogger(logger));
  app.use(helmet());
  app.setGlobalPrefix("v1", {
    exclude: [
      { path: "health/live", method: RequestMethod.GET },
      { path: "health/ready", method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  );
  app.enableShutdownHooks();

  await app.listen(environment.PORT, "0.0.0.0");
  logger.info({ port: environment.PORT, apiPrefix: "/v1" }, "api_started");
}

void bootstrap();
