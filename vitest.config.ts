import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["apps/**/*.spec.ts", "packages/**/*.test.ts"],
    environment: "node",
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
