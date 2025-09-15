/** @type {import('next').NextConfig} */
const nextConfig = {
  
  images: {
    domains: ["localhost", "127.0.0.1"],
  },

  //Security headers work on Vercel
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