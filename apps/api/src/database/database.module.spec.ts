import type { AppLogger } from "@makemymarrige/logger";
import type { Connection } from "mongoose";
import { describe, expect, it, vi } from "vitest";
import { MongoReadiness } from "./database.module.js";

function readiness(state: number, hello?: Record<string, unknown>, connects = true, hangs = false) {
  const command = vi
    .fn()
    .mockReturnValue(hangs ? new Promise(() => undefined) : Promise.resolve(hello));
  const connection = {
    readyState: state,
    db: { admin: () => ({ command }) },
    openUri: vi.fn(async () => {
      if (!connects) throw new Error("offline");
      (connection as { readyState: number }).readyState = 1;
      return connection;
    }),
  } as unknown as Connection;
  const logger = { warn: vi.fn() } as unknown as AppLogger;
  return { instance: new MongoReadiness(connection, "mongodb://local/test", logger), command };
}

describe("MongoDB readiness", () => {
  it("distinguishes disconnected state", async () => {
    const { instance } = readiness(0, undefined, false);
    expect(await instance.status()).toBe("disconnected");
  });

  it("does not treat a replica-set member without write-primary status as ready", async () => {
    const { instance } = readiness(1, { setName: "rs0", isWritablePrimary: false });
    expect(await instance.status()).toBe("no-writable-primary");
    expect(await instance.isReady()).toBe(false);
  });

  it("requires a writable primary and does not infer transaction support from setName", async () => {
    const { instance } = readiness(1, { setName: "rs0", isWritablePrimary: true });
    expect(await instance.status()).toBe("writable-primary");
    const { instance: standalone } = readiness(1, { isWritablePrimary: true });
    expect(await standalone.status()).toBe("no-writable-primary");
  });

  it("bounds a stalled topology probe", async () => {
    const { instance } = readiness(1, undefined, true, true);
    const started = Date.now();
    expect(await instance.status()).toBe("no-writable-primary");
    expect(Date.now() - started).toBeLessThan(2500);
  });
});
