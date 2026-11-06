import { afterEach, describe, expect, it } from "vitest";
import { WorkerHealthServer } from "./health-server.js";

describe("worker operational health endpoints", () => {
  let server: WorkerHealthServer | undefined;

  afterEach(async () => {
    await server?.close();
    server = undefined;
  });

  it("reports liveness and readiness", async () => {
    server = new WorkerHealthServer({ isReady: async () => true });
    const port = await server.listen(0);

    const live = await fetch(`http://127.0.0.1:${port}/health/live`);
    const ready = await fetch(`http://127.0.0.1:${port}/health/ready`);
    expect(live.status).toBe(200);
    expect(await live.json()).toEqual({ status: "ok" });
    expect(ready.status).toBe(200);
    expect(await ready.json()).toEqual({ status: "ready" });
  });

  it("returns unavailable when Redis is not ready", async () => {
    server = new WorkerHealthServer({ isReady: async () => false });
    const port = await server.listen(0);

    const ready = await fetch(`http://127.0.0.1:${port}/health/ready`);
    expect(ready.status).toBe(503);
    expect(await ready.json()).toEqual({ status: "not_ready" });
  });
});
