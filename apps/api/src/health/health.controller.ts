import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { MongoReadiness } from "../database/database.module.js";

@Controller("health")
export class HealthController {
  constructor(private readonly mongoReadiness: MongoReadiness) {}

  @Get("live")
  live(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("ready")
  async ready(): Promise<{ status: "ready" }> {
    if (!(await this.mongoReadiness.isReady())) {
      throw new ServiceUnavailableException("MongoDB is not ready.");
    }
    return { status: "ready" };
  }
}
