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
};

export default nextConfig;
