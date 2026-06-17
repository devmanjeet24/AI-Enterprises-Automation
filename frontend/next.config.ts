import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:20378";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/overview",
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: "/overview",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
