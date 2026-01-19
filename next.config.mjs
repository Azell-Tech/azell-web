/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'devseniorvatuta.github.io' },
      { protocol: 'https', hostname: 'papaya-dieffenbachia-9f2990.netlify.app' },
    ],
  },
};

export default nextConfig;
