import { describe, expect, it } from "vitest";
import { validateApiEnvironment } from "./config.js";

describe("API environment validation", () => {
  it("requires a MongoDB connection string", () => {
    expect(() => validateApiEnvironment({})).toThrow();
  });

  it("accepts a valid local environment", () => {
    expect(
      validateApiEnvironment({ MONGODB_URI: "mongodb://localhost:27017/app", PORT: "4000" }).PORT,
    ).toBe(4000);
  });
});
