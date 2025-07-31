import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
