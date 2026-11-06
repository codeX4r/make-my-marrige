import { createServer, type Server } from "node:http";
import type { RedisBullMqBoundary } from "./redis-bullmq.boundary.js";

export class WorkerHealthServer {
  private server: Server | undefined;

  constructor(private readonly readiness: Pick<RedisBullMqBoundary, "isReady">) {}

  async listen(port: number): Promise<number> {
    this.server = createServer(async (request, response) => {
      if (request.url === "/health/live") {
        response.writeHead(200, { "content-type": "application/json" }).end('{"status":"ok"}');
        return;
      }
      if (request.url === "/health/ready") {
        const ready = await this.readiness.isReady();
        response
          .writeHead(ready ? 200 : 503, { "content-type": "application/json" })
          .end(JSON.stringify({ status: ready ? "ready" : "not_ready" }));
        return;
      }
      response.writeHead(404).end();
    });
    await new Promise<void>((resolve, reject) => {
      this.server?.once("error", reject);
      this.server?.listen(port, "0.0.0.0", resolve);
    });
    const address = this.server.address();
    return address && typeof address === "object" ? address.port : port;
  }

  async close(): Promise<void> {
    if (!this.server?.listening) return;
    await new Promise<void>((resolve, reject) => {
      this.server?.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
