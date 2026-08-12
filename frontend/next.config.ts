import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from the backend server
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
      },
    ],
  },
};

export default nextConfig;
