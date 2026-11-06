/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
const { loadEnvConfig } = require("@next/env");
const path = require("node:path");

function resolveMonorepoRoot(nextConfigDirectory) {
  return path.resolve(nextConfigDirectory, "../..");
}

function loadMonorepoEnvironment(nextConfigDirectory) {
  loadEnvConfig(resolveMonorepoRoot(nextConfigDirectory));
}

module.exports = { loadMonorepoEnvironment, resolveMonorepoRoot };
