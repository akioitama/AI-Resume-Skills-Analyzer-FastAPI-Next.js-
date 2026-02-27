/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true, // required for Next.js 16+ App Router
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",          // any request to /api/*
        destination: "http://localhost:8000/:path*", // proxy to FastAPI
      },
    ];
  },
};

module.exports = nextConfig;