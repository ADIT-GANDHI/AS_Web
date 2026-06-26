/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

/** '' = live deploy at https://ajab.damnetworks.com/ (root). Override with NEXT_PUBLIC_BASE_PATH. */
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH !== undefined
    ? process.env.NEXT_PUBLIC_BASE_PATH
    : '';

const nextConfig = {
  ...(isProd ? { output: 'export' } : {}),
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  devIndicators: false,
};

export default nextConfig;
