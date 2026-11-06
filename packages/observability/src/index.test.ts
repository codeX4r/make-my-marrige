import { describe, expect, it } from "vitest";
import { resolveRequestId } from "./index.js";

describe("resolveRequestId", () => {
  it("preserves a safe incoming id", () => {
    expect(resolveRequestId("req-123")).toBe("req-123");
  });

  it("replaces unsafe values with a generated id", () => {
    expect(resolveRequestId("bad\r\nheader")).toMatch(/^[0-9a-f-]{36}$/);
  });
});
