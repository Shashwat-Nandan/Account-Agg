/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@account-agg/shared'],
  experimental: {
    serverComponentsExternalPackages: ['@noir-lang/noir_js', '@aztec/bb.js'],
  },
};

module.exports = nextConfig;
