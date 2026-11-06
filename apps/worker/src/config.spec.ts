import { describe, expect, it } from "vitest";
import { validateWorkerEnvironment } from "./config.js";

describe("worker environment validation", () => {
  it("requires a Redis connection URL", () => {
    expect(() => validateWorkerEnvironment({})).toThrow();
  });

  it("accepts a valid local environment", () => {
    expect(
      validateWorkerEnvironment({ REDIS_URL: "redis://localhost:6379", WORKER_HEALTH_PORT: "4001" })
        .WORKER_HEALTH_PORT,
    ).toBe(4001);
  });
});
