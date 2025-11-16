import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable Turbopack to isolate build hanging issue
  // turbopack: {
  //   root: '/Users/lilu/Desktop/gcse-pal',
  // },

  // TypeScript setting for development - enable for production, disable for dev speed
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // Image optimization settings
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Output configuration
  output: 'standalone',
  trailingSlash: true,

  // Build optimizations
  compress: true,
  poweredByHeader: false,

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
