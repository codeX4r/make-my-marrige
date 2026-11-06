import { DynamicModule, Module, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import mongoose, { type Connection } from "mongoose";
import type { AppLogger } from "@makemymarrige/logger";

export const MONGO_CONNECTION = Symbol("MONGO_CONNECTION");
export type MongoReadinessStatus = "disconnected" | "no-writable-primary" | "writable-primary";
const READINESS_TIMEOUT_MS = 2_000;

export class MongoReadiness {
  private connecting: Promise<void> | undefined;

  constructor(
    private readonly connection: Connection,
    private readonly uri: string,
    private readonly logger: AppLogger,
  ) {}

  async isReady(): Promise<boolean> {
    return (await this.status()) === "writable-primary";
  }

  async status(): Promise<MongoReadinessStatus> {
    if (Number(this.connection.readyState) !== 1) {
      await this.connect();
      if (this.connection.readyState !== 1) return "disconnected";
    }
    const result = await this.withTimeout(this.checkWritablePrimary());
    return result === "timeout" ? "no-writable-primary" : result;
  }

  private async connect(): Promise<void> {
    if (!this.connecting) {
      this.connecting = this.connection
        .openUri(this.uri, {
          serverSelectionTimeoutMS: READINESS_TIMEOUT_MS,
          connectTimeoutMS: READINESS_TIMEOUT_MS,
        })
        .then(() => undefined)
        .catch((error: unknown) => {
          this.logger.warn(
            { errorName: error instanceof Error ? error.name : "UnknownError" },
            "mongodb_not_ready",
          );
        })
        .finally(() => {
          this.connecting = undefined;
        });
    }
    await this.connecting;
  }

  private async withTimeout<T>(work: Promise<T>): Promise<T | "timeout"> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        work,
        new Promise<"timeout">((resolve) => {
          timer = setTimeout(() => resolve("timeout"), READINESS_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async checkWritablePrimary(): Promise<MongoReadinessStatus> {
    try {
      const hello = await this.connection.db?.admin().command({ hello: 1, maxTimeMS: 1500 });
      if (!hello || typeof hello.setName !== "string") {
        this.logger.warn({ topology: "standalone" }, "mongodb_not_replica_set");
        return "no-writable-primary";
      }
      return hello.isWritablePrimary === true ? "writable-primary" : "no-writable-primary";
    } catch {
      return "no-writable-primary";
    }
  }
}

class MongoConnectionLifecycle implements OnApplicationShutdown, OnModuleInit {
  constructor(
    private readonly connection: Connection,
    private readonly readiness: MongoReadiness,
  ) {}

  onModuleInit(): void {
    void this.readiness.isReady();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.connection.close();
  }
}

@Module({})
export class DatabaseModule {
  static register(uri: string, logger: AppLogger): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: MONGO_CONNECTION,
          useFactory: (): Connection => mongoose.createConnection(),
        },
        {
          provide: MongoReadiness,
          useFactory: (connection: Connection) => new MongoReadiness(connection, uri, logger),
          inject: [MONGO_CONNECTION],
        },
        {
          provide: MongoConnectionLifecycle,
          useFactory: (connection: Connection, readiness: MongoReadiness) =>
            new MongoConnectionLifecycle(connection, readiness),
          inject: [MONGO_CONNECTION, MongoReadiness],
        },
      ],
      exports: [MongoReadiness],
    };
  }
}
