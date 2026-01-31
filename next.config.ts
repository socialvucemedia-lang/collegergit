import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize imports for heavy packages (tree-shaking)
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
