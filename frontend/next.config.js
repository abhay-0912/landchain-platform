/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  images: {
    domains: ['gateway.pinata.cloud', 'ipfs.io'],
  },
};
module.exports = nextConfig;
