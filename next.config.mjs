/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

/** '' for ajabuifinal (root). '/new' for ajab.damnetworks.com/new (default prod). */
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH !== undefined
    ? process.env.NEXT_PUBLIC_BASE_PATH
    : isProd
      ? '/new'
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
