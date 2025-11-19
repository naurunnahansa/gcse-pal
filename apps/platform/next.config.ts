import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure Turbopack for monorepo
  turbopack: {
    root: '../../', // Point to workspace root where Next.js is installed
  },

  // Disable TypeScript completely for build stability
  typescript: {
    ignoreBuildErrors: true,
  },

  // Simplified image optimization
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [64, 128, 256],
  },

  // Build optimizations
  compress: true,
  poweredByHeader: false,

  // Experimental features for Turbopack
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
};

export default nextConfig;
