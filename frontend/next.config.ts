import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
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
