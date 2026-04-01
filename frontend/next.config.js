/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY,
    PUBLIC_API_BASE_URL: process.env.PUBLIC_API_BASE_URL,
    PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
