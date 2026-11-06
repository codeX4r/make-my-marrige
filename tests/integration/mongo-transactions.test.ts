import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { afterAll, describe, expect, it } from "vitest";

const mongoUri =
  process.env.MONGODB_URI ??
  "mongodb://127.0.0.1:27018/makemymarrige?replicaSet=rs0&directConnection=true";
const connection = mongoose.createConnection();

afterAll(async () => {
  await connection.close();
});

describe("MongoDB transaction infrastructure", () => {
  it("waits for a writable replica-set primary, then commits and cleans up a smoke record", async () => {
    const deadline = Date.now() + 30_000;
    let topology: Record<string, unknown> | undefined;
    while (Date.now() < deadline) {
      try {
        if (connection.readyState !== 1) {
          await connection.openUri(mongoUri, {
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 3000,
          });
        }
        topology = await connection.db?.admin().command({ hello: 1, maxTimeMS: 1500 });
        if (typeof topology?.setName === "string" && topology.isWritablePrimary === true) break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (typeof topology?.setName !== "string" || topology.isWritablePrimary !== true) {
      throw new Error("MongoDB did not reach a writable replica-set primary within 30 seconds.");
    }
    const collectionName = `foundation_smoke_${randomUUID().replaceAll("-", "")}`;
    const collection = connection.collection(collectionName);
    const session = await connection.startSession();

    try {
      await session.withTransaction(async () => {
        await collection.insertOne(
          { kind: "foundation-smoke", createdAt: new Date() },
          { session },
        );
      });
      expect(await collection.countDocuments({ kind: "foundation-smoke" })).toBe(1);
    } finally {
      await collection.drop().catch(() => undefined);
      await session.endSession();
    }
  });
});
