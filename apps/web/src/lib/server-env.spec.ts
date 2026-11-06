import { describe, expect, it } from "vitest";
import { validateWebEnvironment } from "./server-env.js";

describe("web server environment validation", () => {
  it("requires an HTTP API origin", () => {
    expect(() => validateWebEnvironment({})).toThrow();
    expect(() => validateWebEnvironment({ API_BASE_URL: "file:///tmp/api" })).toThrow();
  });

  it("accepts an HTTP API origin", () => {
    expect(validateWebEnvironment({ API_BASE_URL: "http://localhost:4000" }).API_BASE_URL).toBe(
      "http://localhost:4000",
    );
  });
});
