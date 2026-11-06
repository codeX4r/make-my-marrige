import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger } from "./index.js";

describe("logger redaction", () => {
  it("redacts credential-like values in structured records", () => {
    const records: string[] = [];
    const sink = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        records.push(chunk.toString());
        callback();
      },
    });
    const logger = createLogger("test", "info", sink);

    logger.info(
      { password: "plain-secret", req: { headers: { authorization: "Bearer secret-token" } } },
      "request",
    );

    const output = records.join("");
    expect(output).not.toContain("plain-secret");
    expect(output).not.toContain("secret-token");
    expect(output).toContain("[REDACTED]");
  });
});
