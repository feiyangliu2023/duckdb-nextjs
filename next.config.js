/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Explicitly define redirects to be empty
  async redirects() {
    return [];
  }
}

module.exports = nextConfig