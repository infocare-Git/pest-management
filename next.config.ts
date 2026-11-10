import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app has its own lockfile; don't let Next pick up a parent folder as the root.
  outputFileTracingRoot: path.resolve(process.cwd()),
};

export default nextConfig;
