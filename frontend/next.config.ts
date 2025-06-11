import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable CSS optimization to avoid conflicts between MUI and Tailwind
  experimental: {
    optimizeCss: false,
  },
  
  // Configure Emotion compiler
  compiler: {
    emotion: {
      sourceMap: true,
      autoLabel: 'dev-only',
      labelFormat: '[local]',
    },
  },
  
  // Ensure correct module resolution
  webpack: (config, { isServer }) => {
    // Prevent module resolution conflicts
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
};

export default nextConfig;
