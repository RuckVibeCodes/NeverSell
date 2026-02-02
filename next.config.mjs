/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/coins/images/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/gh/trustwallet/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/trustwallet/**',
      },
      {
        protocol: 'https',
        hostname: 'tokens.1inch.io',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
