import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['canvas']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias.canvas = false
    }
    return config
  }
};

export default nextConfig;
