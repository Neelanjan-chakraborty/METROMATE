import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets several local previews run side by side (each with its own build folder).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [80, 90],
    // A zip uploaded straight to Netlify has no image optimizer behind it.
    unoptimized: process.env.STATIC_EXPORT === '1',
  },
  // Set STATIC_EXPORT=1 to emit a plain `out/` folder we can zip and drop on Netlify.
  ...(process.env.STATIC_EXPORT === '1' ? { output: 'export' as const } : {}),
};

export default nextConfig;
