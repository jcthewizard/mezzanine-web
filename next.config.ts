import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Uncomment and set this if deploying to a subdirectory (e.g., username.github.io/repo-name)
  // basePath: "/mezzanine-v2",
  // assetPrefix: "/mezzanine-v2",
};

export default nextConfig;
