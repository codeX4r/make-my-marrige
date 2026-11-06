import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getWebEnvironment } from "./server-env.js";

const require = createRequire(import.meta.url);
const { loadMonorepoEnvironment, resolveMonorepoRoot } =
  require("../../env-bootstrap.cjs") as typeof import("../../env-bootstrap.cjs");

const originalApiBaseUrl = process.env.API_BASE_URL;
const temporaryDirectories: string[] = [];

afterEach(async () => {
  if (originalApiBaseUrl === undefined) {
    delete process.env.API_BASE_URL;
  } else {
    process.env.API_BASE_URL = originalApiBaseUrl;
  }

  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("monorepo environment bootstrap", () => {
  it("resolves the repository root from the Next config location, independent of cwd", async () => {
    const root = await mkdtemp(join(tmpdir(), "makemymarrige-env-"));
    temporaryDirectories.push(root);
    const webDirectory = join(root, "apps", "web");
    await mkdir(webDirectory, { recursive: true });

    const originalWorkingDirectory = process.cwd();
    try {
      process.chdir(tmpdir());
      expect(resolveMonorepoRoot(webDirectory)).toBe(root);
    } finally {
      process.chdir(originalWorkingDirectory);
    }
  });

  it("loads the root .env before server environment validation", async () => {
    const root = await mkdtemp(join(tmpdir(), "makemymarrige-env-"));
    temporaryDirectories.push(root);
    await mkdir(join(root, "apps", "web"), { recursive: true });
    await writeFile(join(root, ".env"), "API_BASE_URL=http://root-env.test:4000\n", "utf8");
    delete process.env.API_BASE_URL;

    const originalWorkingDirectory = process.cwd();
    try {
      process.chdir(tmpdir());
      loadMonorepoEnvironment(join(root, "apps", "web"));
    } finally {
      process.chdir(originalWorkingDirectory);
    }

    expect(getWebEnvironment().API_BASE_URL).toBe("http://root-env.test:4000");
  });
});
