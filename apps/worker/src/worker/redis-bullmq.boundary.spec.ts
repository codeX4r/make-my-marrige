import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RedisFake = {
  status: string;
  ping: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  quit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};
type QueueFake = {
  getJobCounts: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  failProbe: boolean;
};
const fakes = vi.hoisted(() => ({
  redis: undefined as unknown as RedisFake,
  queue: undefined as unknown as QueueFake,
}));

vi.mock("ioredis", () => ({
  Redis: class FakeRedis {
    status = "wait";
    ping = vi.fn(async () => {
      if (this.status !== "ready") throw new Error("redis offline");
      return "PONG";
    });
    connect = vi.fn(async () => {
      this.status = "ready";
    });
    on = vi.fn();
    quit = vi.fn(async () => "OK");
    disconnect = vi.fn(() => {
      this.status = "end";
    });
    constructor() {
      fakes.redis = this;
    }
  },
}));

vi.mock("bullmq", () => ({
  Queue: class FakeQueue {
    getJobCounts = vi.fn(async () => {
      if (fakes.queue?.failProbe) throw new Error("queue unavailable");
      return {};
    });
    close = vi.fn(async () => undefined);
    on = vi.fn();
    failProbe = false;
    constructor() {
      fakes.queue = this;
    }
  },
}));

import { RedisBullMqBoundary } from "./redis-bullmq.boundary.js";

const logger = { info: vi.fn(), warn: vi.fn() };

describe("Redis and BullMQ recovery boundary", () => {
  let boundary: RedisBullMqBoundary;

  beforeEach(() => {
    vi.useRealTimers();
    boundary = new RedisBullMqBoundary(
      { REDIS_URL: "redis://localhost:6379" } as never,
      logger as never,
    );
  });

  afterEach(async () => {
    await boundary.onApplicationShutdown();
  });

  it("recovers after Redis is initially unavailable", async () => {
    fakes.redis.status = "end";
    fakes.redis.connect.mockRejectedValueOnce(new Error("offline"));
    boundary.onModuleInit();
    await vi.waitFor(async () => expect(await boundary.isReady()).toBe(false), { timeout: 3000 });
    fakes.redis.status = "end";
    fakes.redis.connect.mockImplementation(async () => {
      fakes.redis.status = "ready";
    });
    await vi.waitFor(async () => expect(await boundary.isReady()).toBe(true), { timeout: 3000 });
  });

  it("returns not ready on BullMQ probe failure, then recovers", async () => {
    fakes.queue.failProbe = true;
    boundary.onModuleInit();
    await vi.waitFor(async () => expect(fakes.redis.status).toBe("ready"));
    expect(await boundary.isReady()).toBe(false);
    fakes.queue.failProbe = false;
    await vi.waitFor(async () => expect(await boundary.isReady()).toBe(true), { timeout: 3000 });
  });

  it("bounds readiness and closes queue and Redis on shutdown", async () => {
    boundary.onModuleInit();
    await vi.waitFor(async () => expect(fakes.redis.status).toBe("ready"));
    fakes.redis.ping.mockImplementationOnce(() => new Promise(() => undefined));
    const started = Date.now();
    expect(await boundary.isReady()).toBe(false);
    expect(Date.now() - started).toBeLessThan(2500);
    await boundary.onApplicationShutdown();
    expect(fakes.queue.close).toHaveBeenCalledOnce();
    expect(fakes.redis.quit).toHaveBeenCalledOnce();
  });
});
