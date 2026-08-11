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
  // Proxy /api/* calls to the backend in development to avoid CORS
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.BACKEND_API_URL || "http://localhost:8080"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
