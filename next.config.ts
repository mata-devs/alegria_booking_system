import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Legacy /operator/* → /Operator/* redirects: see middleware.ts (exact paths only). */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
