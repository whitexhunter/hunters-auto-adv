/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { domains: ['cdn.discordapp.com'] },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://hunters-api.onrender.com'}/api/:path*` },
    ];
  },
  output: 'standalone',
};
module.exports = nextConfig;
