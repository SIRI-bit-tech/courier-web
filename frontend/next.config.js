/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false, // Remove X-Powered-By header
  
  experimental: {
    serverComponentsExternalPackages: ["@radix-ui/react-slot"],
    webVitalsAttribution: ['CLS', 'LCP'],
    optimizeCss: true, // Optimize CSS
    scrollRestoration: true, // Restore scroll position
  },

  // 🚀 PERFORMANCE OPTIMIZATIONS
  swcMinify: true, // Use SWC minifier (faster than Terser)
  
  // Bundle analyzer for production builds
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      if (process.env.NODE_ENV === 'production') {
        // Add bundle analyzer
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: './analyze/client.html',
          })
        )
      }
      return config
    },
  }),

  images: {
    domains: ["localhost", "127.0.0.1", "yourdomain.com", "www.yourdomain.com"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'], // Modern formats
    minimumCacheTTL: 86400, // 24 hours cache
    dangerouslyAllowSVG: false,
    unoptimized: process.env.NODE_ENV === "development",
  },

  // Compression and optimization
  compress: true, // Enable gzip compression
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              chunks: 'all',
              priority: 20,
            },
            leaflet: {
              test: /[\\/]node_modules[\\/]leaflet[\\/]/,
              name: 'leaflet',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      }
    }

    // Add performance hints
    if (!dev) {
      config.performance = {
        hints: 'warning',
        maxAssetSize: 512000, // 512KB
        maxEntrypointSize: 512000, // 512KB
      }
    }

    return config
  },

  // Headers for performance and security
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          
          // Performance headers
          { key: 'X-Accel-Buffering', value: 'no' }, // Disable buffering for streaming
          
          // Cache control for static assets
          ...(isDevelopment ? [] : [
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
          ]),
          
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: isDevelopment 
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' ws://localhost:8000 ws://127.0.0.1:8000 wss://localhost:8000 wss://127.0.0.1:8000 http://localhost:8000 http://127.0.0.1:8000 https://maps.googleapis.com; object-src 'self' data:; frame-src 'self' https://www.google.com;"
              : "default-src 'self'; script-src 'self' https://maps.googleapis.com https://www.gstatic.com; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob: https://maps.googleapis.com; connect-src 'self' wss: https: https://maps.googleapis.com; object-src 'none'; frame-src 'none';"
          },
        ],
      },
      
      // API routes specific headers
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      
      // Static assets optimization
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // Redirects for performance
  async redirects() {
    return [
      // Redirect www to non-www or vice versa for consistency
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.yourdomain.com' }],
        destination: 'https://yourdomain.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig