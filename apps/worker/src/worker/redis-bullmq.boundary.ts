import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type { WorkerEnvironment } from "../config.js";
import { WORKER_LOGGER } from "./tokens.js";
import type { AppLogger } from "@makemymarrige/logger";

const PROBE_INTERVAL_MS = 1_000;
const PROBE_TIMEOUT_MS = 2_000;

@Injectable()
export class RedisBullMqBoundary implements OnModuleInit, OnApplicationShutdown {
  private readonly redis: Redis;
  private readonly queue: Queue;
  private initialized = false;
  private lastConnectionWarning = 0;
  private retryTimer: ReturnType<typeof setInterval> | undefined;
  private probeInFlight = false;

  constructor(
    @Inject("WORKER_ENVIRONMENT") environment: WorkerEnvironment,
    @Inject(WORKER_LOGGER) private readonly logger: AppLogger,
  ) {
    this.redis = new Redis(environment.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      connectTimeout: PROBE_TIMEOUT_MS,
      commandTimeout: PROBE_TIMEOUT_MS,
      retryStrategy: () => null,
    });
    this.queue = new Queue("foundation-health", { connection: this.redis });
    this.redis.on("error", this.logConnectionError);
    this.queue.on("error", this.logConnectionError);
  }

  onModuleInit(): void {
    this.scheduleProbe();
    this.retryTimer = setInterval(() => this.scheduleProbe(), PROBE_INTERVAL_MS);
    this.retryTimer.unref?.();
  }

  async isReady(): Promise<boolean> {
    if (!this.initialized || this.redis.status !== "ready") return false;
    try {
      const ready = await this.boundedProbe();
      if (!ready) this.initialized = false;
      return ready;
    } catch {
      this.initialized = false;
      return false;
    }
  }

  private scheduleProbe(): void {
    if (this.probeInFlight) return;
    this.probeInFlight = true;
    void this.connectAndProbe()
      .catch(this.logConnectionError)
      .finally(() => {
        this.probeInFlight = false;
      });
  }

  private async boundedProbe(): Promise<boolean> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          await this.redis.ping();
          await this.queue.getJobCounts();
          return true;
        })(),
        new Promise<false>((resolve) => {
          timer = setTimeout(() => resolve(false), PROBE_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async connectAndProbe(): Promise<void> {
    if (this.redis.status === "wait" || this.redis.status === "end") await this.redis.connect();
    if (!(await this.boundedProbe())) throw new Error("Redis/BullMQ readiness probe timed out.");
    if (!this.initialized) this.logger.info("redis_bullmq_ready");
    this.initialized = true;
  }

  private readonly logConnectionError = (error: unknown): void => {
    const now = Date.now();
    if (now - this.lastConnectionWarning < 30_000) return;
    this.lastConnectionWarning = now;
    this.logger.warn(
      { errorName: error instanceof Error ? error.name : "UnknownError" },
      "redis_connection_error",
    );
  };

  async onApplicationShutdown(): Promise<void> {
    if (this.retryTimer) clearInterval(this.retryTimer);
    try {
      await this.queue.close();
    } finally {
      if (this.redis.status === "ready") {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            this.redis.quit(),
            new Promise<void>((resolve) => {
              timer = setTimeout(resolve, PROBE_TIMEOUT_MS);
            }),
          ]);
        } finally {
          if (timer) clearTimeout(timer);
          this.redis.disconnect();
        }
      } else {
        this.redis.disconnect();
      }
    }
  }
}
