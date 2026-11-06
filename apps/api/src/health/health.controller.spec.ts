import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterEach, describe, it } from "vitest";
import { MongoReadiness } from "../database/database.module.js";
import { HealthController } from "./health.controller.js";

describe("operational health endpoints", () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("reports liveness and dependency readiness", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: MongoReadiness, useValue: { isReady: () => true } }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get("/health/live").expect(200, { status: "ok" });
    await request(app.getHttpServer()).get("/health/ready").expect(200, { status: "ready" });
  });

  it("returns unavailable while MongoDB is not ready", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: MongoReadiness, useValue: { isReady: async () => false } }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get("/health/ready").expect(503);
  });
});
