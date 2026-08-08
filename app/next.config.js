/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@x402/evm': false,
      '@x402/evm/upto/client': false,
      '@x402/evm/exact/client': false,
      '@x402/svm': false,
      '@x402/svm/upto/client': false,
      '@x402/svm/exact/client': false,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
