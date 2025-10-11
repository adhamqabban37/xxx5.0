/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    // Optimize image qualities for performance and file size
    qualities: [35, 50, 75, 85, 100],
    // Enable next-gen formats
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Limit image sizes for performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable optimization
    minimumCacheTTL: 31536000, // 1 year cache
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // HSTS (HTTP Strict Transport Security)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Content Security Policy with upgrade-insecure-requests
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://vitals.vercel-analytics.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // Preconnect to external domains for performance
          {
            key: 'Link',
            value:
              '<https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect; crossorigin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/stripe/webhook',
        destination: '/api/stripe/webhook',
      },
    ];
  },

  // Docker standalone build support
  output: 'standalone',

  // Optimize for serverless/container environments
  outputFileTracingRoot: __dirname,

  // Externalize lighthouse packages to prevent Turbopack bundling issues
  serverExternalPackages: ['lighthouse', 'chrome-launcher', 'puppeteer-core', 'puppeteer'],

  // Alternative Turbopack configuration (if needed)
  // experimental: {
  //   turbo: {
  //     rules: {
  //       '*.{js,jsx,ts,tsx}': {
  //         loaders: ['builtin:swc-loader'],
  //         as: '*.js'
  //       }
  //     },
  //     resolveAlias: {
  //       // Prevent lighthouse from being bundled
  //       'lighthouse': 'lighthouse',
  //       'chrome-launcher': 'chrome-launcher'
  //     }
  //   }
  // },
};

module.exports = nextConfig;
