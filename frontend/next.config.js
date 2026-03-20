/** @type {import('next').NextConfig} */

const buildApiUploadPattern = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  try {
    const parsed = new URL(apiUrl);
    return {
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      port: parsed.port || '',
      pathname: '/uploads/**',
    };
  } catch {
    return {
      protocol: 'http',
      hostname: 'localhost',
      port: '5000',
      pathname: '/uploads/**',
    };
  }
};

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      buildApiUploadPattern(),
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '5000', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
