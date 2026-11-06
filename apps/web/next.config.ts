import type { NextConfig } from "next";
import { createRequire } from "node:module";

const { loadMonorepoEnvironment } = createRequire(__filename)(
  "./env-bootstrap.cjs",
) as typeof import("./env-bootstrap.cjs");
loadMonorepoEnvironment(__dirname);

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
};

export default config;
