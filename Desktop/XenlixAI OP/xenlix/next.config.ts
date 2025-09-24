import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,   // disable optimizer globally for now
    remotePatterns: [
      { 
        protocol: "https", 
        hostname: "via.placeholder.com" 
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude server-only packages from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Exclude server-only modules from client bundle
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
      
      // Exclude lighthouse and chrome-launcher from client bundle
      config.externals = [
        ...(config.externals || []),
        'lighthouse',
        'chrome-launcher',
      ];
    }

    return config;
  },
  experimental: {
    // Allow server components to use dynamic imports
    serverComponentsExternalPackages: ['lighthouse', 'chrome-launcher']
  },
};

export default nextConfig;
