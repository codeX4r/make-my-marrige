import { randomUUID } from "node:crypto";
import { Queue, QueueEvents, Worker } from "bullmq";
import { Redis } from "ioredis";
import { describe, expect, it } from "vitest";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const parsedRedisUrl = new URL(redisUrl);
const redisConnection = {
  host: parsedRedisUrl.hostname,
  port: Number(parsedRedisUrl.port || 6379),
  ...(parsedRedisUrl.username ? { username: decodeURIComponent(parsedRedisUrl.username) } : {}),
  ...(parsedRedisUrl.password ? { password: decodeURIComponent(parsedRedisUrl.password) } : {}),
  ...(parsedRedisUrl.pathname.length > 1 ? { db: Number(parsedRedisUrl.pathname.slice(1)) } : {}),
  ...(parsedRedisUrl.protocol === "rediss:" ? { tls: {} } : {}),
};

describe("BullMQ and Redis infrastructure", () => {
  it("sends and completes a foundation smoke job", async () => {
    const probe = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    probe.on("error", () => undefined);
    let available = false;
    const deadline = Date.now() + 30_000;
    while (!available && Date.now() < deadline) {
      try {
        if (probe.status === "wait" || probe.status === "end") await probe.connect();
        await probe.ping();
        available = true;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    if (!available) {
      probe.disconnect();
      throw new Error("Redis did not become available within 30 seconds.");
    }
    try {
      await probe.ping();
    } finally {
      if (probe.status === "ready") await probe.quit();
      else probe.disconnect();
    }

    const queueName = `foundation-smoke-${randomUUID()}`;
    const queue = new Queue(queueName, { connection: redisConnection });
    const events = new QueueEvents(queueName, { connection: redisConnection });
    const worker = new Worker(queueName, async (job) => ({ received: job.data.value }), {
      connection: redisConnection,
    });

    try {
      await Promise.all([queue.waitUntilReady(), events.waitUntilReady(), worker.waitUntilReady()]);
      const job = await queue.add("foundation-check", { value: "ready" });
      const result = await job.waitUntilFinished(events, 15_000);
      expect(result).toEqual({ received: "ready" });
    } finally {
      await worker.close();
      await events.close();
      await queue.obliterate({ force: true }).catch(() => undefined);
      await queue.close();
    }
  });
});
