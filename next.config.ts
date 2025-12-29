import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/mezzanine-web",
  assetPrefix: "/mezzanine-web",
};

export default nextConfig;
