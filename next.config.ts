import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicit root prevents Turbopack from picking up the lockfile in the
    // parent C:\Projects\LingoBeat\ directory and misidentifying workspace root.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
