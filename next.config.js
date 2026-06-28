/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['libsodium-wrappers'],
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({ 'libsodium-wrappers': 'commonjs libsodium-wrappers' });
    return config;
  },
}

module.exports = nextConfig
