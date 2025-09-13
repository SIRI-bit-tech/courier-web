/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["@radix-ui/react-slot"],
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  images: {
    domains: ["localhost", "127.0.0.1"],
    unoptimized: process.env.NODE_ENV === "development",
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ FIX: Environment-aware CSP (works for both dev and prod)
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers (always applied)
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          
          // ✅ FIX: Single-line CSP without line breaks
          {
            key: 'Content-Security-Policy',
            value: isDevelopment 
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' ws://localhost:8000 ws://127.0.0.1:8000 wss://localhost:8000 wss://127.0.0.1:8000 http://localhost:8000 http://127.0.0.1:8000 https://maps.googleapis.com; object-src 'self' data:; frame-src 'self' https://www.google.com;"
              : "default-src 'self'; script-src 'self' https://maps.googleapis.com https://www.gstatic.com; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob: https://maps.googleapis.com; connect-src 'self' wss: https: https://maps.googleapis.com; object-src 'none'; frame-src 'none';"
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig