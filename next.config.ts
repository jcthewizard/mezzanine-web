import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  // Only use basePath for production builds (GitHub Pages)
  ...(process.env.NODE_ENV === "production" && {
    basePath: "/mezzanine-web",
    assetPrefix: "/mezzanine-web",
  }),
};

export default nextConfig;
