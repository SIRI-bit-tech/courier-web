/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages static export
  output: "export",
  trailingSlash: true,
  
  //Basic image configuration
  images: {
    domains: ["localhost", "127.0.0.1"],
    unoptimized: true,
  },

  //Simple headers for basic functionality
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = nextConfig